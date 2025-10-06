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
import { createUserActivitiesService } from "packages/db/clickhouse";

// Create instance at module level
const userActivitiesService = createUserActivitiesService();

export const AuthService = {
	async login(
		email: string,
		password: string,
		ipAddress: string,
		userAgent: string,
	): Promise<UserInformation> {
		const user = await UserRepository().findByEmail(email);

		if (user.email_verified_at === null) {
			await userActivitiesService.trackActivity({
				user_id: user.id,
				action: "failed_login",
				resource: "auth/login",
				ip_address: ipAddress,
				metadata: { reason: "email not verified" },
				user_agent: userAgent,
			});

			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Email not verified",
				},
			]);
		}

		if (user.status !== "active") {
			await userActivitiesService.trackActivity({
				user_id: user.id,
				action: "failed_login",
				resource: "auth/login",
				ip_address: ipAddress,
				metadata: { reason: "account not active" },
				user_agent: userAgent,
			});

			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Your account is not active. Please contact administrator.",
				},
			]);
		}

		const isPasswordValid = await Hash.compareHash(password, user.password);
		if (!isPasswordValid) {
			await userActivitiesService.trackActivity({
				user_id: user.id,
				action: "failed_login",
				resource: "auth/login",
				ip_address: ipAddress,
				metadata: { reason: "invalid password" },
				user_agent: userAgent,
			});

			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Invalid email or password",
				},
			]);
		}

		// Track successful login
		await userActivitiesService.trackActivity({
			user_id: user.id,
			action: "login",
			resource: "auth/login",
			ip_address: ipAddress,
			metadata: { status: "success" },
			user_agent: userAgent,
		});

		return await UserRepository().UserInformation(user.id);
	},

	async register(
		data: {
			name: string;
			email: string;
			password: string;
		},
		ipAddress: string,
		userAgent: string,
	): Promise<void> {
		const user = await UserRepository().db.query.users.findFirst({
			where: and(
				eq(usersTable.email, data.email),
				isNull(usersTable.deleted_at),
			),
		});
		if (user) {
			await userActivitiesService.trackActivity({
				user_id: user.id,
				action: "failed_register",
				resource: "auth/register",
				ip_address: ipAddress,
				metadata: { reason: "email already exists" },
				user_agent: userAgent,
			});

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

	async resentVerificationEmail(
		email: string,
		ipAddress: string,
		userAgent: string,
	): Promise<void> {
		const user = await UserRepository().findByEmail(email);
		if (!user) {
			return;
		}

		if (user.email_verified_at) {
			await userActivitiesService.trackActivity({
				user_id: user.id,
				action: "resent_verification_email",
				resource: "auth/resent-verification-email",
				ip_address: ipAddress,
				metadata: { reason: "email already verified" },
				user_agent: userAgent,
			});

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

	async verifyEmail(token: string, ipAddress: string, userAgent: string) {
		const emailVerification = await db
			.select()
			.from(emailVerificationTable)
			.where(eq(emailVerificationTable.token, token))
			.limit(1);

		if (emailVerification.length === 0) {
			await userActivitiesService.trackActivity({
				user_id: "unknown",
				action: "verify_email",
				resource: "auth/verify-email",
				ip_address: ipAddress,
				metadata: { reason: "invalid or expired token" },
				user_agent: userAgent,
			});

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
			await userActivitiesService.trackActivity({
				user_id: emailVerification[0].user_id,
				action: "verify_email",
				resource: "auth/verify-email",
				ip_address: ipAddress,
				metadata: { reason: "invalid or expired token" },
				user_agent: userAgent,
			});

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

	async forgotPassword(
		email: string,
		ipAddress: string,
		userAgent: string,
	): Promise<void> {
		const user = await UserRepository().findByEmail(email);
		if (!user) {
			await userActivitiesService.trackActivity({
				user_id: "unknown",
				action: "forgot_password",
				resource: "auth/forgot-password",
				ip_address: ipAddress,
				metadata: { reason: "user not found", email },
				user_agent: userAgent,
			});

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

	async resetPassword(
		token: string,
		newPassword: string,
		ipAddress: string,
		userAgent: string,
	): Promise<void> {
		const passwordReset = await ForgotPasswordRepository().findByToken(token);
		if (!passwordReset) {
			await userActivitiesService.trackActivity({
				user_id: "unknown",
				action: "reset_password",
				resource: "auth/reset-password",
				ip_address: ipAddress,
				metadata: { reason: "invalid or expired token" },
				user_agent: userAgent,
			});

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
			await userActivitiesService.trackActivity({
				user_id: passwordReset.user_id,
				action: "reset_password",
				resource: "auth/reset-password",
				ip_address: ipAddress,
				metadata: { reason: "user not found" },
				user_agent: userAgent,
			});

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
