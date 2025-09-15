import { db, emailVerificationTable } from "@postgres/index";
import { usersTable } from "@postgres/user";
import { Hash } from "@security/hash";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { and, eq, isNull } from "drizzle-orm";
import { UserInformation } from "@apis/types/UserInformation";
import { AppContext } from "@apis/types/elysia";
import { StrongPassword } from "@default/strong-password";
import { UserRepository } from "../repositories";
import { StrToolkit } from "@toolkit/string";
import {
	AppConfig,
	DateToolkit,
	EmailService,
	verificationTokenLifetime,
} from "@packages/*";
import { UnauthorizedError } from "../errors";
import { Cache } from "@packages_cache/*";

const AuthSchema = {
	LoginSchema: vine.object({
		email: vine.string().email().normalizeEmail(),
		password: vine.string().minLength(1),
	}),

	RegisterSchema: vine.object({
		email: vine.string().email().normalizeEmail().maxLength(255),
		name: vine.string().trim().minLength(1).maxLength(255),
		password: vine.string().regex(StrongPassword),
	}),

	VerifyEmailSchema: vine.object({
		token: vine.string().trim().minLength(1).maxLength(255),
	}),

	ResentVerificationEmailSchema: vine.object({
		email: vine.string().email().normalizeEmail().maxLength(255),
	}),
};

export const AuthHandler = {
	login: async (ctx: AppContext) => {
		try {
			const payload = ctx.body as {
				email: string;
				password: string;
			};

			const validation = await vine.validate({
				schema: AuthSchema.LoginSchema,
				data: payload,
			});

			const user = await db
				.select({
					id: usersTable.id,
					name: usersTable.name,
					password: usersTable.password,
					email: usersTable.email,
					status: usersTable.status,
					email_verified_at: usersTable.email_verified_at,
				})
				.from(usersTable)
				.where(
					and(
						eq(usersTable.email, validation.email),
						isNull(usersTable.deleted_at),
					),
				)
				.limit(1);

			// Use consistent error message for security
			const invalidCredentialsError = [
				{
					field: "email",
					message: "Invalid email or password",
				},
			];

			if (user.length === 0) {
				return ResponseToolkit.validationError(ctx, invalidCredentialsError);
			}

			const isPasswordValid = await Hash.compareHash(
				validation.password,
				user[0].password,
			);
			if (!isPasswordValid) {
				return ResponseToolkit.validationError(ctx, invalidCredentialsError);
			}

			// check if the email is verified
			if (!user[0].email_verified_at) {
				return ResponseToolkit.validationError(ctx, [
					{
						field: "email",
						message: "Please verify your email address before logging in",
					},
				]);
			}

			// check if the status is active
			if (user[0].status !== "active") {
				return ResponseToolkit.validationError(ctx, [
					{
						field: "email",
						message: `Your account is ${user[0].status}. Please contact support.`,
					},
				]);
			}

			// cache the user
			const userInformation = await UserRepository().UserInformation(
				user[0].id,
			);
			if (!userInformation) {
				throw new UnauthorizedError("User not found");
			}

			const cacheKey = `user:${user[0].id}`;
			await Cache.set(cacheKey, userInformation, 60 * 60);

			// generate jwt token
			const JwtToken = await ctx.jwt.sign({
				id: user[0].id,
			});

			return ResponseToolkit.success<{
				user_information: UserInformation;
				access_token: string;
			}>(
				ctx,
				{
					user_information: userInformation,
					access_token: JwtToken,
				},
				"Login successful",
				200,
			);
		} catch (error) {
			throw error;
		}
	},

	register: async (ctx: AppContext) => {
		try {
			const payload = ctx.body as {
				name: string;
				email: string;
				password: string;
			};

			const validate = await vine.validate({
				schema: AuthSchema.RegisterSchema,
				data: payload,
			});

			// validate if the email exists
			const isEmailExist = await UserRepository()
				.db.select()
				.from(usersTable)
				.where(
					and(
						eq(usersTable.email, validate.email),
						isNull(usersTable.deleted_at),
					),
				)
				.limit(1);

			if (isEmailExist.length > 0) {
				return ResponseToolkit.validationError(ctx, [
					{
						field: "email",
						message: "An account with this email already exists",
					},
				]);
			}

			const hashedPassword = await Hash.generateHash(validate.password);
			await db.transaction(async (trx) => {
				const user = await trx
					.insert(usersTable)
					.values({
						name: validate.name,
						email: validate.email,
						password: hashedPassword,
						status: "active",
					})
					.returning();

				// create email verification token
				const token = StrToolkit.random(255);
				await trx.insert(emailVerificationTable).values({
					token,
					user_id: user[0].id,
					expired_at: verificationTokenLifetime,
				});

				// send email
				await EmailService.sendEmail({
					subject: "Email verification",
					to: validate.email,
					template: "/auth/email-verification",
					variables: {
						user_id: user[0].id,
						user_name: user[0].name,
						user_email: user[0].email,
						verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
					},
				});
			});

			return ResponseToolkit.success(
				ctx,
				{},
				"Registration successful. Please check your email to verify your account.",
				201,
			);
		} catch (error) {
			throw error;
		}
	},

	resentVerificationEmail: async (ctx: AppContext) => {
		try {
			const payload = ctx.body as {
				email: string;
			};

			const validate = await vine.validate({
				schema: AuthSchema.ResentVerificationEmailSchema,
				data: payload,
			});

			// find user
			const user = await UserRepository()
				.db.select()
				.from(usersTable)
				.where(
					and(
						eq(usersTable.email, validate.email),
						isNull(usersTable.deleted_at),
					),
				)
				.limit(1);

			// Always return success for security (don't reveal if email exists)
			if (user.length === 0) {
				return ResponseToolkit.success(
					ctx,
					{},
					"If the email exists, verification email has been sent",
					200,
				);
			}

			// Check if already verified
			if (user[0].email_verified_at) {
				return ResponseToolkit.success(
					ctx,
					{},
					"Email is already verified",
					200,
				);
			}

			// create email verification token
			const token = StrToolkit.random(255);
			await db.transaction(async (trx) => {
				// delete existing tokens
				await trx
					.delete(emailVerificationTable)
					.where(eq(emailVerificationTable.user_id, user[0].id));

				await trx.insert(emailVerificationTable).values({
					token,
					user_id: user[0].id,
					expired_at: verificationTokenLifetime,
				});

				// send email
				await EmailService.sendEmail({
					subject: "Email verification",
					to: validate.email, // Use validated email
					template: "/auth/email-verification",
					variables: {
						user_id: user[0].id,
						user_name: user[0].name,
						user_email: user[0].email,
						verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
					},
				});
			});

			return ResponseToolkit.success(ctx, {}, "Verification email sent", 200);
		} catch (error) {
			throw error;
		}
	},

	verifyEmail: async (ctx: AppContext) => {
		try {
			const payload = ctx.body as {
				token: string;
			};

			const validate = await vine.validate({
				schema: AuthSchema.VerifyEmailSchema,
				data: payload,
			});

			// find token
			const emailVerification = await db
				.select()
				.from(emailVerificationTable)
				.where(eq(emailVerificationTable.token, validate.token))
				.limit(1);

			if (emailVerification.length === 0) {
				return ResponseToolkit.validationError(ctx, [
					{
						field: "token",
						message: "Invalid or expired verification token",
					},
				]);
			}

			// validate the token lifetime - Fixed logic
			const tokenExpiredAt = DateToolkit.parse(
				emailVerification[0].expired_at.toString(),
			);
			const now = DateToolkit.now();

			if (DateToolkit.isBefore(tokenExpiredAt, now)) {
				// Fixed: token expires when expired_at < now
				return ResponseToolkit.validationError(ctx, [
					{
						field: "token",
						message:
							"Verification token has expired. Please request a new one.",
					},
				]);
			}

			await db.transaction(async (trx) => {
				await trx
					.update(usersTable)
					.set({
						email_verified_at: DateToolkit.now().toDate(),
					})
					.where(eq(usersTable.id, emailVerification[0].user_id));

				// delete email verification record
				await trx
					.delete(emailVerificationTable)
					.where(eq(emailVerificationTable.id, emailVerification[0].id));
			});

			return ResponseToolkit.success(
				ctx,
				{},
				"Email verified successfully",
				200,
			);
		} catch (error) {
			throw error;
		}
	},
};
