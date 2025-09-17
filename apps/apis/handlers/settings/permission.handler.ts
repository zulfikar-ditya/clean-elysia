import { AppContext } from "@app/apis/types/elysia";
import { SortDirection } from "@app/apis/types/sortdirection";
import { paginationLength } from "@default/pagination-length";
import { defaultSort } from "@default/sort";
import { db, permissionTable } from "@postgres/index";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { asc, desc, eq, ilike, or } from "drizzle-orm";

const PermissionSchema = {
	CreatePermissionSchema: vine.object({
		name: vine.array(vine.string().minLength(2).maxLength(100)),
		group: vine.string().minLength(2).maxLength(100),
	}),
	UpdatePermissionSchema: vine.object({
		name: vine.string().minLength(2).maxLength(100),
		group: vine.string().minLength(2).maxLength(100),
	}),
};

export const PermissionHandler = {
	list: async (ctx: AppContext) => {
		// query param metadata
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

		// build where conditions
		const whereCondition = search
			? or(
					ilike(permissionTable.name, `%${search}%`),
					ilike(permissionTable.group, `%${search}%`),
				)
			: undefined;

		const validateOrderBy = {
			id: permissionTable.id,
			name: permissionTable.name,
			group: permissionTable.group,
			created_at: permissionTable.createdAt,
			updated_at: permissionTable.updatedAt,
		} as const;

		type OrderableKey = keyof typeof validateOrderBy;
		const normalizedOrderBy: OrderableKey = (
			Object.keys(validateOrderBy) as OrderableKey[]
		).includes(orderBy as OrderableKey)
			? (orderBy as OrderableKey)
			: ("id" as OrderableKey);

		const orderColumn = validateOrderBy[normalizedOrderBy];

		const data = await db.query.permissions.findMany({
			where: whereCondition,
			orderBy: orderDirection === "asc" ? asc(orderColumn) : desc(orderColumn),
			limit: perPage,
			offset: (page - 1) * perPage,
			columns: {
				id: true,
				name: true,
				group: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		const count = await db.$count(permissionTable);

		// const count = await db.query.permissions. $count({
		// 	where: whereCondition,
		// });

		return ResponseToolkit.success(
			ctx,
			{
				data,
				meta: {
					total: count,
					page,
					perPage,
				},
			},
			"Permission list retrieved successfully",
			200,
		);
	},

	create: async (ctx: AppContext) => {
		const payload = ctx.body as {
			name: string[];
			group: string;
		};

		const validate = await vine.validate({
			schema: PermissionSchema.CreatePermissionSchema,
			data: payload,
		});

		// validate if the permission name is already exist
		const permissionNames = validate.name.map((item) => {
			return `${validate.group} ${item}`;
		});

		const existingPermissions = await db.query.permissions.findMany({
			where: or(
				...permissionNames.map((name) => ilike(permissionTable.name, name)),
			),
		});

		if (existingPermissions.length > 0) {
			return ResponseToolkit.validationError(
				ctx,
				[],
				`Some permission is already exist ${existingPermissions.map((perm) => perm.name).join(", ")}`,
			);
		}

		await db.transaction(async (tx) => {
			await tx.insert(permissionTable).values(
				payload.name.map((name) => ({
					name: `${validate.group} ${name}`,
					group: validate.group,
				})),
			);
		});

		return ResponseToolkit.success(
			ctx,
			{},
			`Success create permission group ${validate.group}`,
			201,
		);
	},
	detail: async (ctx: AppContext) => {
		const permissionId = ctx.params.id;

		const permission = await db.query.permissions.findFirst({
			where: eq(permissionTable.id, permissionId),
		});

		if (!permission) {
			return ResponseToolkit.notFound(ctx, "Permission not found");
		}

		return ResponseToolkit.success(
			ctx,
			{ ...permission },
			"Permission retrieved successfully",
			200,
		);
	},
	update: async (ctx: AppContext) => {
		const permissionId = ctx.params.id;

		const permission = await db.query.permissions.findFirst({
			where: eq(permissionTable.id, permissionId),
		});

		if (!permission) {
			return ResponseToolkit.notFound(ctx, "Permission not found");
		}

		const payload = ctx.body as {
			name: string[];
			group: string;
		};

		const validate = await vine.validate({
			schema: PermissionSchema.UpdatePermissionSchema,
			data: payload,
		});

		await db.transaction(async (tx) => {
			await tx
				.update(permissionTable)
				.set({
					name: `${validate.name}`,
					group: validate.group,
				})
				.where(eq(permissionTable.id, permissionId));
		});

		return ResponseToolkit.success(
			ctx,
			{},
			`Success update permission ${validate.name}`,
			200,
		);
	},
	delete: async (ctx: AppContext) => {
		const permissionId = ctx.params.id;

		const permission = await db.query.permissions.findFirst({
			where: eq(permissionTable.id, permissionId),
		});

		if (!permission) {
			return ResponseToolkit.notFound(ctx, "Permission not found");
		}

		await db.transaction(async (tx) => {
			await tx
				.delete(permissionTable)
				.where(eq(permissionTable.id, permissionId));
		});

		return ResponseToolkit.success(
			ctx,
			{},
			`Success delete permission ${permission.name}`,
			200,
		);
	},
};
