import { AppContext } from "@app/apis/types/elysia";
import { SortDirection } from "@app/apis/types/sortdirection";
import { paginationLength } from "@default/pagination-length";
import { defaultSort } from "@default/sort";
import { StrongPassword } from "@default/strong-password";
import { db, userRolesTable, usersTable } from "@postgres/index";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { and, asc, desc, eq, ilike, is, isNotNull, not, or } from "drizzle-orm";

const UserSchema = {
	CreateUserSchema: vine.object({
		name: vine.string().minLength(2).maxLength(100),
		email: vine.string().email().maxLength(255),
		status: vine
			.enum(["active", "inactive", "suspended", "blocked"])
			.optional(),
		remark: vine.string().maxLength(255).optional(),
		password: vine.string().regex(StrongPassword).confirmed(),
		role_ids: vine.array(vine.string().uuid()).optional(),
	}),
	UpdateUserSchema: vine.object({
		name: vine.string().minLength(2).maxLength(100),
		email: vine.string().email().maxLength(255),
		status: vine
			.enum(["active", "inactive", "suspended", "blocked"])
			.optional(),
		remark: vine.string().maxLength(255).optional(),
		role_ids: vine.array(vine.string().uuid()).optional(),
	}),
	ResendVerificationEmailSchema: vine.object({
		email: vine.string().email().maxLength(255),
	}),
	ResendResetPasswordEmailSchema: vine.object({
		email: vine.string().email().maxLength(255),
	}),
};

export const UserHandler = {
	list: async (ctx: AppContext) => {
		const query = ctx.query;
		const page: number = query.page ? parseInt(query.page as string, 10) : 1;
		const perPage: number = query.perPage
			? parseInt(query.perPage as string, 10)
			: paginationLength;
		const search: string | null = query.search
			? (query.search as string)
			: null;
		const orderBy: string = query.sort ? (query.sort as string) : defaultSort;
		const orderDirection: SortDirection = query.sortDirection
			? (query.sortDirection as SortDirection)
			: "desc";

		const whereCondition = search
			? and(
					or(ilike(usersTable.name, `%${search}%`)),
					or(ilike(usersTable.email, `%${search}%`)),
					or(ilike(usersTable.status, `%${search}%`)),
					isNotNull(usersTable.deleted_at),
				)
			: isNotNull(usersTable.deleted_at);

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

		const data = await db.query.users.findMany({
			where: whereCondition,
			orderBy: orderDirection === "asc" ? asc(orderColumn) : desc(orderColumn),
			limit: perPage,
			offset: (page - 1) * perPage,
			columns: {
				id: true,
				name: true,
				email: true,
				status: true,
				created_at: true,
				updated_at: true,
			},
		});

		const count = await db.$count(usersTable, whereCondition);

		return ResponseToolkit.success(
			ctx,
			{
				data,
				meta: {
					totalCount: count,
					page,
					perPage,
				},
			},
			"Success get user list",
			200,
		);
	},

	create: async (ctx: AppContext) => {
		const payload = ctx.body;

		const validate = await vine.validate({
			schema: UserSchema.CreateUserSchema,
			data: payload,
		});

		// validate is the email exist
		const isEmailExist = await db
			.select()
			.from(usersTable)
			.where(
				and(
					eq(usersTable.email, validate.email),
					isNotNull(usersTable.deleted_at),
				),
			)
			.limit(1);

		if (isEmailExist.length > 0) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "email",
					message: "Email already exists",
				},
			]);
		}

		await db.transaction(async (trx) => {
			const user = await trx
				.insert(usersTable)
				.values({
					name: validate.name,
					email: validate.email,
					password: validate.password,
					status: validate.status || "active",
					remark: validate.remark || null,
				})
				.returning();

			if (validate.role_ids && validate.role_ids.length > 0) {
				if (user.length > 0) {
					const userId = user[0].id;
					const userRoles: {
						userId: string;
						roleId: string;
					}[] = validate.role_ids.map((roleId) => ({
						userId,
						roleId,
					}));

					await trx.insert(userRolesTable).values(userRoles);
				}
			}
		});

		return ResponseToolkit.success(ctx, {}, "User created successfully", 201);
	},

	detail: async (ctx: AppContext) => {
		const userId = ctx.params.id;

		const user = await db.query.users.findFirst({
			with: {
				user_roles: {
					with: {
						role: true,
					},
				},
			},
			where: and(eq(usersTable.id, userId), isNotNull(usersTable.deleted_at)),
			columns: {
				id: true,
				name: true,
				email: true,
				status: true,
				remark: true,
				created_at: true,
				updated_at: true,
			},
		});

		if (!user) {
			return ResponseToolkit.notFound(ctx, "User not found");
		}

		return ResponseToolkit.success(ctx, user, "Success get user detail", 200);
	},

	update: async (ctx: AppContext) => {
		const userId = ctx.params.id;
		const payload = ctx.body;

		const validate = await vine.validate({
			schema: UserSchema.UpdateUserSchema,
			data: payload,
		});

		const user = await db.query.users.findFirst({
			where: eq(usersTable.id, userId),
		});

		if (!user) {
			return ResponseToolkit.notFound(ctx, "User not found");
		}

		// validate the email, cant be duplicate, make sure the email only for this user
		const isEmailExist = await db
			.select()
			.from(usersTable)
			.where(
				and(
					eq(usersTable.email, validate.email),
					isNotNull(usersTable.deleted_at),
					not(eq(usersTable.id, userId)),
				),
			)
			.limit(1);

		if (isEmailExist.length > 0) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "email",
					message: "Email already exists",
				},
			]);
		}

		await db.transaction(async (trx) => {
			const user = await trx
				.update(usersTable)
				.set({
					name: validate.name,
					email: validate.email,
					...(validate.status && { status: validate.status }),
					...(validate.remark && { remark: validate.remark }),
				})
				.where(eq(usersTable.id, userId))
				.returning();

			// remove all role or adding new role
			if (validate.role_ids && validate.role_ids.length > 0) {
				if (user.length > 0) {
					const userId = user[0].id;
					await trx
						.delete(userRolesTable)
						.where(eq(userRolesTable.userId, userId));
					const userRoles: {
						userId: string;
						roleId: string;
					}[] = validate.role_ids.map((roleId) => ({
						userId,
						roleId,
					}));
					await trx.insert(userRolesTable).values(userRoles);
				}
			} else {
				if (user.length > 0) {
					const userId = user[0].id;
					await trx
						.delete(userRolesTable)
						.where(eq(userRolesTable.userId, userId));
				}
			}
		});

		return ResponseToolkit.success(ctx, {}, "User updated successfully", 200);
	},

	delete: async (ctx: AppContext) => {
		const userId = ctx.params.id;

		const user = await db.query.users.findFirst({
			where: eq(usersTable.id, userId),
		});

		if (!user) {
			return ResponseToolkit.notFound(ctx, "User not found");
		}

		await db.transaction(async (trx) => {
			await trx
				.update(usersTable)
				.set({ deleted_at: new Date() })
				.where(eq(usersTable.id, userId));
		});

		return ResponseToolkit.success(ctx, {}, "User deleted successfully", 200);
	},
};
