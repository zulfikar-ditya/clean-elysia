import { db, usersTable } from "@postgres/index";
import { UserInformation } from "@apis/types/UserInformation";
import { and, eq, isNotNull } from "drizzle-orm";
import { UnauthorizedError } from "../errors";

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
				.where(
					and(
						eq(usersTable.id, userId),
						eq(usersTable.status, "active"),
						isNotNull(usersTable.deleted_at),
					),
				)
				.limit(1);

			if (user.length > 0) {
				return user[0];
			}

			throw new UnauthorizedError("User not found");
		},
	};
};
