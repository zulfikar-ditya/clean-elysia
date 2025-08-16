import { db, emailVerificationTable } from "@postgres/index";
import { usersTable } from "@postgres/user";
import { Hash } from "@security/hash";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { and, eq, isNotNull } from "drizzle-orm";
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

const AuthSchema = {
	LoginSchema: vine.object({
		email: vine.string().email(),
		password: vine.string(),
	}),

	RegisterSchema: vine.object({
		email: vine.string().email().maxLength(255),
		name: vine.string().maxLength(255),
		password: vine.string().regex(StrongPassword),
	}),

	VerifyEmailSchema: vine.object({
		token: vine.string().maxLength(255),
	}),

	ResentVerificationEmailSchema: vine.object({
		email: vine.string().email().maxLength(255),
	}),
};

export const AuthHandler = {
	login: async (ctx: AppContext) => {
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
			})
			.from(usersTable)
			.where(
				and(
					eq(usersTable.email, validation.email),
					isNotNull(usersTable.email_verified_at),
				),
			)
			.limit(1);

		if (user.length === 0) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "email",
					message: "Invalid email or password",
				},
			]);
		}

		const isPasswordValid = await Hash.compareHash(
			payload.password,
			user[0].password,
		);
		if (!isPasswordValid) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "password",
					message: "Invalid email or password",
				},
			]);
		}

		// eslint-disable-next-line
		const JwtToken = await ctx.jwt.sign({
			id: user[0].id,
		});

		return ResponseToolkit.success<{
			user_information: UserInformation;
			access_token: string;
		}>(
			ctx,
			{
				user_information: {
					id: user[0].id,
					email: user[0].email,
					name: user[0].name,
				},
				access_token: JwtToken,
			},
			"Login successful",
			200,
		);
	},

	register: async (ctx: AppContext) => {
		const payload = ctx.body as {
			name: string;
			email: string;
			password: string;
		};

		const validate = await vine.validate({
			schema: AuthSchema.RegisterSchema,
			data: payload,
		});

		// validate is the email exist
		const isEmailExist = await UserRepository()
			.db.select()
			.from(usersTable)
			.where(and(eq(usersTable.email, validate.email)))
			.limit(1);

		if (isEmailExist.length > 0) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "email",
					message: "Email already exists",
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
			"User registered successfully",
			201,
		);
	},

	resentVerificationEmail: async (ctx: AppContext) => {
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
			.where(eq(usersTable.email, validate.email))
			.limit(1);

		if (user.length === 0) {
			return ResponseToolkit.success(ctx, {}, "Verification email resent", 200);
		}

		// create email verification token
		const token = StrToolkit.random(255);
		await db.transaction(async (trx) => {
			// delete the other token
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
				to: payload.email,
				template: "/auth/email-verification",
				variables: {
					user_id: user[0].id,
					user_name: user[0].name,
					user_email: user[0].email,
					verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
				},
			});
		});

		return ResponseToolkit.success(ctx, {}, "Verification email resent", 200);
	},

	verifyEmail: async (ctx: AppContext) => {
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
					message: "Invalid or expired token",
				},
			]);
		}

		// validate the token lifetime
		if (
			DateToolkit.isBefore(
				DateToolkit.parse(emailVerification[0].expired_at.toString()),
				DateToolkit.now(),
			)
		) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "token",
					message: "Token has expired",
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

		return ResponseToolkit.success(ctx, {}, "Email verified successfully", 200);
	},
};
