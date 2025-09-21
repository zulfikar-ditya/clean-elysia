import { db, usersTable } from "@postgres";
import { eq, ne, and } from "drizzle-orm";
import { Hash } from "@security/hash";
import { UnauthorizedError, UnprocessableEntityError } from "../errors";
import { Cache, UserInformationCacheKey } from "@packages_cache/*";
import { UserRepository } from "../repositories";
import { UserInformation } from "../types/UserInformation";

export const ProfileService = {
	async updateProfile(
		userId: string,
		data: { name: string; email: string },
	): Promise<UserInformation> {
		const isEmailExist = await db
			.select()
			.from(usersTable)
			.where(and(eq(usersTable.email, data.email), ne(usersTable.id, userId)))
			.limit(1);

		if (isEmailExist.length > 0) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "email",
					message: "Email already in use.",
				},
			]);
		}

		await db.transaction(async (tx) => {
			return await tx
				.update(usersTable)
				.set({
					name: data.name,
					email: data.email,
				})
				.where(eq(usersTable.id, userId))
				.returning();
		});

		const user: UserInformation =
			await UserRepository().UserInformation(userId);

		const userCacheKey = UserInformationCacheKey(userId);
		await Cache.delete(userCacheKey);
		await Cache.set(userCacheKey, user, 60 * 60);

		return user;
	},

	async updatePassword(
		userId: string,
		data: {
			current_password: string;
			new_password: string;
		},
	) {
		const currentUser = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, userId))
			.limit(1);

		if (currentUser.length === 0) {
			throw new UnauthorizedError();
		}

		const isPasswordValid = await Hash.compareHash(
			data.current_password,
			currentUser[0].password,
		);

		if (!isPasswordValid) {
			throw new UnprocessableEntityError("Validation error", [
				{
					field: "current_password",
					message: "Current password is incorrect",
				},
			]);
		}

		await db.transaction(async (tx) => {
			await tx
				.update(usersTable)
				.set({
					password: await Hash.generateHash(data.new_password),
				})
				.where(eq(usersTable.id, userId));
		});
		return true;
	},
};
