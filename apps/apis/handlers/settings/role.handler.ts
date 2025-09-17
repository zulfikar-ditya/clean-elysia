import { AppContext } from "@app/apis/types/elysia";
import { SortDirection } from "@app/apis/types/sortdirection";
import { paginationLength } from "@default/pagination-length";
import { defaultSort } from "@default/sort";
import { db } from "@postgres/index";
import { rolePermissionTable, roleTable } from "@postgres/rbac";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { and, asc, desc, eq, ilike, ne, or } from "drizzle-orm";

const RoleSchema = {
	CreatePermissionSchema: vine.object({
		name: vine.string().minLength(2).maxLength(255),
		permission_ids: vine.array(vine.string().minLength(1).uuid()),
	}),
	UpdatePermissionSchema: vine.object({
		name: vine.string().minLength(2).maxLength(255),
		permission_ids: vine.array(vine.string().minLength(1).uuid()),
	}),
};

export const RoleHandler = {
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
			? or(ilike(roleTable.name, `%${search}%`))
			: undefined;

		const validateOrderBy = {
			id: roleTable.id,
			name: roleTable.name,
			createdAt: roleTable.createdAt,
			updatedAt: roleTable.updatedAt,
		};

		type OrderableKey = keyof typeof validateOrderBy;
		const normalizedOrderBy: OrderableKey = (
			Object.keys(validateOrderBy) as OrderableKey[]
		).includes(orderBy as OrderableKey)
			? (orderBy as OrderableKey)
			: ("id" as OrderableKey);

		const orderColumn = validateOrderBy[normalizedOrderBy];

		const data = await db.query.roles.findMany({
			where: and(ne(roleTable.name, "superuser"), whereCondition),
			orderBy: orderDirection === "asc" ? asc(orderColumn) : desc(orderColumn),
			limit: perPage,
			offset: (page - 1) * perPage,
			columns: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		const count = await db.$count(roleTable, whereCondition);

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
			"Success get role list",
			200,
		);
	},

	create: async (ctx: AppContext) => {
		const payload = ctx.body as {
			name: string;
			permission_ids: string[];
		};

		const validate = await vine.validate({
			schema: RoleSchema.CreatePermissionSchema,
			data: payload,
		});

		const isNameExists = await db.query.roles.findFirst({
			where: eq(roleTable.name, validate.name),
		});

		if (isNameExists) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "name",
					message: `The role name for ${validate.name} already exists`,
				},
			]);
		}

		await db.transaction(async (tx) => {
			const role = await tx
				.insert(roleTable)
				.values({
					name: validate.name,
				})
				.returning()
				.execute();

			if (!role || !role[0].id) {
				throw new Error("Role can't be created");
			}

			if (validate.permission_ids.length > 0) {
				await tx.insert(rolePermissionTable).values(
					validate.permission_ids.map((permissionId) => ({
						roleId: role[0].id,
						permissionId,
					})),
				);
			}
		});

		return ResponseToolkit.success(ctx, {}, "Success create new role", 200);
	},

	detail: async (ctx: AppContext) => {
		const roleId = ctx.params.id;

		const role = await db.query.roles.findFirst({
			where: eq(roleTable.id, roleId),
			with: {
				role_permissions: {
					with: {
						permission: true,
					},
				},
			},
			columns: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!role) {
			return ResponseToolkit.notFound(ctx, "Role not found");
		}

		return ResponseToolkit.success(ctx, role, "Success get role detail", 200);
	},

	update: async (ctx: AppContext) => {
		const roleId = ctx.params.id;
		const payload = ctx.body as {
			name: string;
			permission_ids: string[];
		};

		const validate = await vine.validate({
			schema: RoleSchema.UpdatePermissionSchema,
			data: payload,
		});

		const role = await db.query.roles.findFirst({
			where: eq(roleTable.id, roleId),
		});

		if (!role) {
			return ResponseToolkit.notFound(ctx, "Role not found");
		}

		await db.transaction(async (tx) => {
			await tx
				.update(roleTable)
				.set({
					name: validate.name,
				})
				.where(eq(roleTable.id, roleId));

			await tx
				.delete(rolePermissionTable)
				.where(eq(rolePermissionTable.roleId, roleId));

			await tx.insert(rolePermissionTable).values(
				validate.permission_ids.map((permissionId) => ({
					roleId,
					permissionId,
				})),
			);
		});

		return ResponseToolkit.success(ctx, {}, "Success update role", 200);
	},

	delete: async (ctx: AppContext) => {
		const roleId = ctx.params.id;

		const role = await db.query.roles.findFirst({
			where: eq(roleTable.id, roleId),
		});

		if (!role) {
			return ResponseToolkit.notFound(ctx, "Role not found");
		}

		await db.transaction(async (tx) => {
			await tx.delete(roleTable).where(eq(roleTable.id, roleId));
			await tx
				.delete(rolePermissionTable)
				.where(eq(rolePermissionTable.roleId, roleId));
		});

		return ResponseToolkit.success(ctx, {}, "Success delete role", 200);
	},
};
