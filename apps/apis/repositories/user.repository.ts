import { db, usersTable } from "@postgres/index";
import { UserInformation } from "@apis/types/UserInformation";
import { and, eq, isNull } from "drizzle-orm";
import { UnauthorizedError } from "../errors";

export const UserRepository = () => {
	const dbInstance = db;

	return {
		db: dbInstance,
		UserInformation: async (userId: string): Promise<UserInformation> => {
			const user = await dbInstance.query.users.findFirst({
				where: and(
					eq(usersTable.id, userId),
					eq(usersTable.status, "active"),
					isNull(usersTable.deleted_at),
				),

				columns: {
					id: true,
					email: true,
					name: true,
				},

				with: {
					user_roles: {
						columns: {
							roleId: true,
							userId: true,
						},

						with: {
							role: {
								columns: {
									id: true,
									name: true,
								},
								with: {
									role_permissions: {
										columns: {
											roleId: true,
											permissionId: true,
										},
										with: {
											permission: {
												columns: {
													id: true,
													name: true,
													group: true,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			});

			if (!user) {
				throw new UnauthorizedError("User not found");
			}

			return {
				id: user.id,
				email: user.email,
				name: user.name,
				roles: user.user_roles.map((userRole) => userRole.role.name),
				permissions: user.user_roles.map((userRole) => ({
					name: userRole.role.name,
					permissions: userRole.role.role_permissions.map(
						(rolePermission) => rolePermission.permission.name,
					),
				})),
			};
		},
	};
};
