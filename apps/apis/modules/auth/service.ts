import { BadRequestError } from "@app/apis/errors";
import {
	ForgotPasswordRepository,
	UserRepository,
} from "@app/apis/repositories";
import { UserInformation } from "@app/apis/types/UserInformation";
import { sendEmailQueue } from "@app/worker/queue/send-email.queue";
import { verificationTokenLifetime } from "@packages/*";
import { db, email_verificationsTable, usersTable } from "@postgres/index";
import { Hash } from "@security/hash";
import { StrToolkit } from "@toolkit/string";
import { AppConfig } from "config/app.config";
import { eq } from "drizzle-orm";

export const AuthService = {
	singIn: async (email: string, password: string): Promise<UserInformation> => {
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
					message: "Email not verified",
				},
			]);
		}

		if (user.status !== "active") {
			throw new BadRequestError("Validation error", [
				{
					field: "email",
					message: "Your account is not active. Please contact administrator.",
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

		return await UserRepository().UserInformation(user.id);
	},

	register: async (data: {
		name: string;
		email: string;
		password: string;
	}): Promise<void> => {
		const existingUser = await UserRepository().findByEmail(data.email);
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
		});

		return;
	},

	async resentVerificationEmail(email: string): Promise<void> {
		const user = await UserRepository().findByEmail(email);
		if (!user) {
			return;
		}

		if (user.email_verified_at) {
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
	},

	verifyEmail: async (token: string): Promise<void> => {
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
					message: "Invalid or expired token",
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
	},

	forgotPassword: async (email: string): Promise<void> => {
		const user = await UserRepository().findByEmail(email);
		if (!user) {
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
	},

	resetPassword: async (token: string, password: string): Promise<void> => {
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
				.where(eq(ForgotPasswordRepository().getTable().id, passwordReset.id));
		});
	},
};
