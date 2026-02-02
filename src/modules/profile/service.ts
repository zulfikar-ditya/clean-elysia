import {
	db,
	UnprocessableEntityError,
	UserInformation,
	UserRepository,
} from "@libs";
import { NotFoundError } from "elysia";

export const ProfileService = {
	updateProfile: async (
		userId: string,
		data: { name: string; email: string },
	): Promise<UserInformation> => {
		const user = await UserRepository().getDetail(userId);
		if (!user) {
			throw new NotFoundError("User not found");
		}

		if (data.email !== user.email) {
			const existingUser = await UserRepository().findByEmail(data.email);
			if (existingUser) {
				throw new UnprocessableEntityError("Validation error", [
					{
						field: "email",
						message: "Email is already registered",
					},
				]);
			}
		}

		await db.transaction(async (tx) => {
			await UserRepository().update(
				userId,
				{
					name: data.name,
					email: data.email,
				},
				tx,
			);
		});

		return await UserRepository().UserInformation(user.id);
	},
};
