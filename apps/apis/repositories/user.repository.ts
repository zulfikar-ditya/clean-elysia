import { db, usersTable } from "@postgres/index";
import { UserInformation } from "@apis/types/UserInformation";
import { eq } from "drizzle-orm";

export const UserRepository = () => {
	const dbInstance = db;

	return {
		db: dbInstance,
		UserInformation: async (userId: string): Promise<UserInformation> => {
			const user = await dbInstance
				.select({
					id: usersTable.id,
					email: usersTable.email,
					name: usersTable.name,
				})
				.from(usersTable)
				.where(eq(usersTable.id, userId))
				.limit(1);

			if (user.length > 0) {
				return user[0];
			}

			throw new Error("User not found");
		},
	};
};
