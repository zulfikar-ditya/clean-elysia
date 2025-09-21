import { db, emailVerificationTable } from "@postgres/index";
import { usersTable } from "@postgres/user";
import { Hash } from "@security/hash";
import { and, eq, isNull } from "drizzle-orm";
import { UserRepository } from "../repositories";
import { StrToolkit } from "@toolkit/string";
import {
	AppConfig,
	EmailService,
	verificationTokenLifetime,
	DateToolkit,
} from "@packages/*";
import { UnprocessableEntityError } from "../errors";
import { UserInformation } from "../types/UserInformation";

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

			await EmailService.sendEmail({
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
			await EmailService.sendEmail({
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
};
