// apps/apis/modules/auth/service.ts
import { UserInformation } from "@app/apis/types/UserInformation";
import { sendEmailQueue } from "@app/worker/queue/send-email.queue";
import { verificationTokenLifetime } from "@packages/*";
import { log } from "@packages/logger/logger";
import { db, email_verificationsTable, usersTable } from "@postgres/index";
import {
	ForgotPasswordRepository,
	UserRepository,
} from "@postgres/repositories";
import { Hash } from "@security/hash";
import { StrToolkit } from "@toolkit/string";
import { AppConfig } from "config/app.config";
import { eq } from "drizzle-orm";
import { BadRequestError } from "packages/errors";

export const AuthService = {
	singIn: async (email: string, password: string): Promise<UserInformation> => {
		try {
			const user = await UserRepository().findByEmail(email);

			if (!user) {
				throw new BadRequestError("Validation error", [
					{
						field: "email",
						message: "Invalid email or password",
					},
				]);
			}

			if (user.email_verified_at === null) {
				throw new BadRequestError("Validation error", [
					{
						field: "email",
						message: "Email not verified. Please check your inbox.",
					},
				]);
			}

			if (user.status !== "active") {
				throw new BadRequestError("Validation error", [
					{
						field: "email",
						message: "Your account is inactive. Please contact support.",
					},
				]);
			}

			const isPasswordValid = await Hash.compareHash(password, user.password);

			if (!isPasswordValid) {
				throw new BadRequestError("Validation error", [
					{
						field: "email",
						message: "Invalid email or password",
					},
				]);
			}

			// Log successful login
			log.info(
				{ userId: user.id, email: user.email },
				"User logged in successfully",
			);

			return await UserRepository().UserInformation(user.id);
		} catch (error) {
			if (error instanceof BadRequestError) {
				throw error;
			}
			log.error({ error, email }, "Login error");
			throw new BadRequestError("Validation error", [
				{
					field: "email",
					message: "An error occurred during login",
				},
			]);
		}
	},

	register: async (data: {
		name: string;
		email: string;
		password: string;
	}): Promise<void> => {
		try {
			const existingUser = await UserRepository()
				.findByEmail(data.email)
				.catch(() => null);

			if (existingUser) {
				throw new BadRequestError("Validation error", [
					{
						field: "email",
						message: "Email is already registered",
					},
				]);
			}

			const hashedPassword = await Hash.generateHash(data.password);

			await db.transaction(async (tx) => {
				const newUser = await UserRepository().create(
					{
						name: data.name,
						email: data.email,
						password: hashedPassword,
					},
					tx,
				);

				const token = StrToolkit.random(255);

				await tx.insert(email_verificationsTable).values({
					token,
					user_id: newUser.id,
					expired_at: verificationTokenLifetime,
				});

				// Queue email instead of blocking
				await sendEmailQueue.add("send-email", {
					subject: "Email verification",
					to: data.email,
					template: "/auth/email-verification",
					variables: {
						user_id: newUser.id,
						user_name: newUser.name,
						user_email: newUser.email,
						verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
					},
				});

				log.info(
					{ userId: newUser.id, email: newUser.email },
					"User registered successfully",
				);
			});
		} catch (error) {
			if (error instanceof BadRequestError) {
				throw error;
			}
			log.error({ error, email: data.email }, "Registration error");
			throw new BadRequestError("Validation error", [
				{
					field: "general",
					message: "An error occurred during registration",
				},
			]);
		}
	},

	async resentVerificationEmail(email: string): Promise<void> {
		try {
			const user = await UserRepository()
				.findByEmail(email)
				.catch(() => null);

			// Silent return if user doesn't exist (security: don't reveal if email is registered)
			if (!user) {
				log.warn(
					{ email },
					"Verification email requested for non-existent user",
				);
				return;
			}

			if (user.email_verified_at) {
				log.info(
					{ userId: user.id, email },
					"Verification email requested for already verified user",
				);
				return;
			}

			const token = StrToolkit.random(255);

			await db.insert(email_verificationsTable).values({
				token,
				user_id: user.id,
				expired_at: verificationTokenLifetime,
			});

			await sendEmailQueue.add("send-email", {
				subject: "Email verification",
				to: email,
				template: "/auth/email-verification",
				variables: {
					user_id: user.id,
					user_name: user.name,
					user_email: user.email,
					verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
				},
			});

			log.info({ userId: user.id, email }, "Verification email resent");
		} catch (error) {
			log.error({ error, email }, "Error resending verification email");
			// Silent failure - don't expose errors to client
		}
	},

	verifyEmail: async (token: string): Promise<void> => {
		try {
			const record =
				(
					await db
						.select()
						.from(email_verificationsTable)
						.where(eq(email_verificationsTable.token, token))
				)[0] ?? null;

			if (!record || record.expired_at < new Date()) {
				throw new BadRequestError("Validation error", [
					{
						field: "token",
						message: "Invalid or expired verification token",
					},
				]);
			}

			await db.transaction(async (trx) => {
				await trx
					.update(usersTable)
					.set({ email_verified_at: new Date() })
					.where(eq(usersTable.id, record.user_id));

				await trx
					.delete(email_verificationsTable)
					.where(eq(email_verificationsTable.user_id, record.user_id));
			});

			log.info({ userId: record.user_id }, "Email verified successfully");
		} catch (error) {
			if (error instanceof BadRequestError) {
				throw error;
			}
			log.error({ error, token }, "Email verification error");
			throw new BadRequestError("Validation error", [
				{
					field: "token",
					message: "An error occurred during email verification",
				},
			]);
		}
	},

	forgotPassword: async (email: string): Promise<void> => {
		try {
			const user = await UserRepository()
				.findByEmail(email)
				.catch(() => null);

			// Silent return if user doesn't exist (security: don't reveal if email is registered)
			if (!user) {
				log.warn({ email }, "Password reset requested for non-existent user");
				return;
			}

			const token = StrToolkit.random(255);

			await ForgotPasswordRepository().create({
				user_id: user.id,
				token,
			});

			await sendEmailQueue.add("send-email", {
				subject: "Reset Password",
				to: email,
				template: "/auth/forgot-password",
				variables: {
					user_id: user.id,
					user_name: user.name,
					user_email: user.email,
					reset_password_url: `${AppConfig.CLIENT_URL}/auth/reset-password?token=${token}`,
				},
			});

			log.info({ userId: user.id, email }, "Password reset email sent");
		} catch (error) {
			log.error({ error, email }, "Error sending password reset email");
			// Silent failure - don't expose errors to client
		}
	},

	resetPassword: async (token: string, password: string): Promise<void> => {
		try {
			const passwordReset = await ForgotPasswordRepository().findByToken(token);

			if (!passwordReset) {
				throw new BadRequestError("Validation error", [
					{
						field: "token",
						message: "Invalid or expired password reset token",
					},
				]);
			}

			const hashedPassword = await Hash.generateHash(password);

			await db.transaction(async (trx) => {
				await trx
					.update(usersTable)
					.set({ password: hashedPassword })
					.where(eq(usersTable.id, passwordReset.user_id));

				await trx
					.delete(ForgotPasswordRepository().getTable())
					.where(
						eq(ForgotPasswordRepository().getTable().id, passwordReset.id),
					);
			});

			log.info(
				{ userId: passwordReset.user_id },
				"Password reset successfully",
			);
		} catch (error) {
			if (error instanceof BadRequestError) {
				throw error;
			}
			log.error({ error, token }, "Password reset error");
			throw new BadRequestError("Validation error", [
				{
					field: "token",
					message: "An error occurred during password reset",
				},
			]);
		}
	},
};
