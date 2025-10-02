import { db, emailVerificationTable } from "@postgres/index";
import { usersTable } from "@postgres/user";
import { Hash } from "@security/hash";
import { and, eq, isNull } from "drizzle-orm";
import { ForgotPasswordRepository, UserRepository } from "../repositories";
import { StrToolkit } from "@toolkit/string";
import { AppConfig, verificationTokenLifetime, DateToolkit } from "@packages/*";
import { UnprocessableEntityError } from "../errors";
import { UserInformation } from "../types/UserInformation";
import { sendEmailQueue } from "@app/worker/queue/send-email.queue";
import { passwordResetPasswordTable } from "../../../packages/db/postgres/password_reset_token";

export const AuthService = {
	async login(email: string, password: string): Promise<UserInformation> {
		const user = await UserRepository().findByEmail(email);

		if (user.email_verified_at === null) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Email not verified",
				},
			]);
		}

		if (user.status !== "active") {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Your account is not active. Please contact administrator.",
				},
			]);
		}

		const isPasswordValid = await Hash.compareHash(password, user.password);
		if (!isPasswordValid) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Invalid email or password",
				},
			]);
		}

		return await UserRepository().UserInformation(user.id);
	},

	async register(data: {
		name: string;
		email: string;
		password: string;
	}): Promise<void> {
		const user = await UserRepository().db.query.users.findFirst({
			where: and(
				eq(usersTable.email, data.email),
				isNull(usersTable.deleted_at),
			),
		});
		if (user) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Email already exists",
				},
			]);
		}

		const hashPassword = await Hash.generateHash(data.password);
		await db.transaction(async (trx) => {
			const newUser = await trx
				.insert(usersTable)
				.values({
					name: data.name,
					email: data.email,
					password: hashPassword,
					status: "active",
				})
				.returning();

			const token = StrToolkit.random(255);
			await trx.insert(emailVerificationTable).values({
				token,
				user_id: newUser[0].id,
				expired_at: verificationTokenLifetime,
			});

			await sendEmailQueue.add("send-email", {
				subject: "Email verification",
				to: data.email,
				template: "/auth/email-verification",
				variables: {
					user_id: newUser[0].id,
					user_name: newUser[0].name,
					user_email: newUser[0].email,
					verification_url: `${AppConfig.CLIENT_URL}/auth/verify-email?token=${token}`,
				},
			});
		});
	},

	async resentVerificationEmail(email: string): Promise<void> {
		const user = await UserRepository().findByEmail(email);
		if (!user) {
			return;
		}

		if (user.email_verified_at) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Email already verified",
				},
			]);
		}

		const token = StrToolkit.random(255);
		await db.transaction(async (trx) => {
			await trx
				.delete(emailVerificationTable)
				.where(eq(emailVerificationTable.user_id, user.id));

			await trx.insert(emailVerificationTable).values({
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
		});
		return;
	},

	async verifyEmail(token: string) {
		const emailVerification = await db
			.select()
			.from(emailVerificationTable)
			.where(eq(emailVerificationTable.token, token))
			.limit(1);

		if (emailVerification.length === 0) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "token",
					message: "Invalid or expired verification token",
				},
			]);
		}

		const tokenExpiredAt = DateToolkit.parse(
			emailVerification[0].expired_at.toString(),
		);
		const now = DateToolkit.now();
		if (DateToolkit.isBefore(tokenExpiredAt, now)) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "token",
					message: "Invalid or expired verification token",
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
			await trx
				.delete(emailVerificationTable)
				.where(eq(emailVerificationTable.id, emailVerification[0].id));
		});
	},

	async forgotPassword(email: string): Promise<void> {
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

	async resetPassword(token: string, newPassword: string): Promise<void> {
		const passwordReset = await ForgotPasswordRepository().findByToken(token);
		if (!passwordReset) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "token",
					message: "Invalid or expired password reset token",
				},
			]);
		}

		const user = await UserRepository().db.query.users.findFirst({
			where: eq(usersTable.id, passwordReset.user_id),
		});
		if (!user) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "token",
					message: "Invalid or expired password reset token",
				},
			]);
		}

		const hashPassword = await Hash.generateHash(newPassword);
		await db.transaction(async (trx) => {
			await trx
				.update(usersTable)
				.set({
					password: hashPassword,
				})
				.where(eq(usersTable.id, user.id));

			await trx
				.delete(passwordResetPasswordTable)
				.where(eq(passwordResetPasswordTable.user_id, user.id));
		});
	},
};
