import { db, userRolesTable, usersTable } from "@postgres/index";
import { UserInformation } from "@apis/types/UserInformation";
import {
	and,
	eq,
	isNull,
	or,
	ilike,
	SQL,
	asc,
	desc,
	exists,
} from "drizzle-orm";
import { UnauthorizedError, UnprocessableEntityError } from "../errors";
import { DatatableType, SortDirection } from "../types/datatable";
import { PaginationResponse } from "../types/pagination";
import { UserStatusEnum } from "../../../packages/db/postgres/user";
import { defaultSort } from "@default/sort";
import { Hash } from "@security/hash";
import { NotFoundError } from "../errors/not-found-error";

export type UserList = {
	id: string;
	name: string;
	email: string;
	status: UserStatusEnum | null;
	roles: string[] | null;
	created_at: Date | null;
	updated_at: Date | null;
};

export type UserCreate = {
	name: string;
	email: string;
	password: string;
	status?: UserStatusEnum;
	remark?: string;
	role_ids?: string[];
};

export type UserDetail = {
	id: string;
	name: string;
	email: string;
	status: UserStatusEnum | null;
	remark: string | null;
	roles: {
		id: string;
		name: string;
	}[];
	created_at: Date | null;
	updated_at: Date | null;
};

export type UserForAuth = {
	id: string;
	name: string;
	email: string;
	password: string;
	status: UserStatusEnum | null;
	email_verified_at: Date | null;
};

export const UserRepository = () => {
	const dbInstance = db;

	return {
		db: dbInstance,

		findAll: async (
			queryParam: DatatableType,
		): Promise<PaginationResponse<UserList>> => {
			const page: number = queryParam.page || 1;
			const limit: number = queryParam.limit || 10;
			const search: string | null = queryParam.search || null;
			const orderBy: string = queryParam.sort ? queryParam.sort : defaultSort;
			const orderDirection: SortDirection = queryParam.sortDirection
				? queryParam.sortDirection
				: "desc";
			const filter: Record<string, boolean | string | Date> | null =
				queryParam.filter || null;
			const offset = (page - 1) * limit;

			let whereCondition: SQL | undefined = isNull(usersTable.deleted_at);
			if (search) {
				whereCondition = and(
					whereCondition,
					or(
						ilike(usersTable.name, `%${search}%`),
						ilike(usersTable.email, `%${search}%`),
						ilike(usersTable.status, `%${search}%`),
					),
				);
			}

			let filteredCondition: SQL | undefined = undefined;
			if (filter) {
				if (filter.status) {
					filteredCondition = and(
						whereCondition,
						eq(usersTable.status, filter.status as UserStatusEnum),
					);
				}

				if (filter.name) {
					filteredCondition = and(
						whereCondition,
						ilike(usersTable.name, `%${filter.name.toString()}%`),
					);
				}

				if (filter.email) {
					filteredCondition = and(
						whereCondition,
						ilike(usersTable.email, `%${filter.email.toString()}%`),
					);
				}

				if (filter.role_id) {
					filteredCondition = and(
						whereCondition,
						exists(
							dbInstance
								.select()
								.from(userRolesTable)
								.where(
									and(
										eq(userRolesTable.userId, usersTable.id),
										eq(userRolesTable.roleId, filter.role_id as string),
									),
								),
						),
					);
				}
			}

			const finalWhereCondition: SQL | undefined = and(
				whereCondition,
				filteredCondition ? filteredCondition : undefined,
			);

			const validateOrderBy = {
				id: usersTable.id,
				name: usersTable.name,
				email: usersTable.email,
				status: usersTable.status,
				created_at: usersTable.created_at,
				updated_at: usersTable.updated_at,
			};

			type OrderableKey = keyof typeof validateOrderBy;
			const normalizedOrderBy: OrderableKey = (
				Object.keys(validateOrderBy) as OrderableKey[]
			).includes(orderBy as OrderableKey)
				? (orderBy as OrderableKey)
				: ("id" as OrderableKey);

			const orderColumn = validateOrderBy[normalizedOrderBy];

			const [data, totalCount] = await Promise.all([
				dbInstance.query.users.findMany({
					where: finalWhereCondition,
					orderBy:
						orderDirection === "asc" ? asc(orderColumn) : desc(orderColumn),
					limit,
					offset,
					columns: {
						id: true,
						name: true,
						email: true,
						status: true,
						created_at: true,
						updated_at: true,
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
								},
							},
						},
					},
				}),
				dbInstance.$count(usersTable, finalWhereCondition),
			]);

			const formattedData: UserList[] = data.map((user) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				status: user.status,
				roles: user.user_roles.map((userRole) => userRole.role.name),
				created_at: user.created_at,
				updated_at: user.updated_at,
			}));

			return {
				data: formattedData,
				meta: {
					page,
					limit,
					totalCount,
				},
			};
		},

		create: async (data: UserCreate): Promise<void> => {
			// validate is the email exist
			const isEmailExist = await db
				.select()
				.from(usersTable)
				.where(
					and(eq(usersTable.email, data.email), isNull(usersTable.deleted_at)),
				)
				.limit(1);

			if (isEmailExist.length > 0) {
				throw new UnprocessableEntityError("Email already exists", [
					{
						field: "email",
						message: "Email already exists",
					},
				]);
			}

			const hashedPassword = await Hash.generateHash(data.password);
			const user = await dbInstance
				.insert(usersTable)
				.values({
					name: data.name,
					email: data.email,
					password: hashedPassword,
					status: data.status || "active",
					remark: data.remark || null,
				})
				.returning();

			if (data.role_ids && data.role_ids.length > 0) {
				if (user.length > 0) {
					const userId = user[0].id;
					const userRoles: {
						userId: string;
						roleId: string;
					}[] = data.role_ids.map((roleId) => ({
						userId,
						roleId,
					}));

					await dbInstance.insert(userRolesTable).values(userRoles);
				}
			}
		},

		getDetail: async (userId: string): Promise<UserDetail> => {
			const user = await dbInstance.query.users.findFirst({
				where: and(eq(usersTable.id, userId), isNull(usersTable.deleted_at)),

				columns: {
					id: true,
					name: true,
					email: true,
					status: true,
					remark: true,
					created_at: true,
					updated_at: true,
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
							},
						},
					},
				},
			});

			if (!user) {
				throw new NotFoundError("User not found");
			}

			return {
				id: user.id,
				name: user.name,
				email: user.email,
				status: user.status,
				remark: user.remark,
				roles: user.user_roles.map((userRole) => ({
					id: userRole.role.id,
					name: userRole.role.name,
				})),
				created_at: user.created_at,
				updated_at: user.updated_at,
			};
		},

		update: async (
			userId: string,
			data: Omit<UserCreate, "password">,
		): Promise<void> => {
			const user = await dbInstance.query.users.findFirst({
				where: and(eq(usersTable.id, userId), isNull(usersTable.deleted_at)),
			});

			if (!user) {
				throw new NotFoundError("User not found");
			}

			await dbInstance
				.update(usersTable)
				.set({
					name: data.name,
					email: data.email,
					status: data.status || user.status,
					remark: data.remark || user.remark,
				})
				.where(eq(usersTable.id, userId));

			// remove all role or adding new role
			if (data.role_ids && data.role_ids.length > 0) {
				await dbInstance
					.delete(userRolesTable)
					.where(eq(userRolesTable.userId, userId));

				const userRoles: {
					userId: string;
					roleId: string;
				}[] = data.role_ids.map((roleId) => ({
					userId,
					roleId,
				}));
				await dbInstance.insert(userRolesTable).values(userRoles);
			} else {
				await dbInstance
					.delete(userRolesTable)
					.where(eq(userRolesTable.userId, userId));
			}
		},

		delete: async (userId: string): Promise<void> => {
			const user = await dbInstance.query.users.findFirst({
				where: and(eq(usersTable.id, userId), isNull(usersTable.deleted_at)),
			});

			if (!user) {
				throw new NotFoundError("User not found");
			}

			await dbInstance
				.update(usersTable)
				.set({ deleted_at: new Date() })
				.where(eq(usersTable.id, userId));
		},

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

		findByEmail: async (email: string): Promise<UserForAuth> => {
			const user = await dbInstance.query.users.findFirst({
				where: and(eq(usersTable.email, email), isNull(usersTable.deleted_at)),
				columns: {
					id: true,
					name: true,
					email: true,
					password: true,
					status: true,
					email_verified_at: true,
				},
			});

			if (!user) {
				throw new UnprocessableEntityError("Validation error", [
					{
						field: "email",
						message: "Invalid email or password",
					},
				]);
			}

			return user;
		},
	};
};
