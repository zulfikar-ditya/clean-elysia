import { AppContext } from "@app/apis/types/elysia";
import { SortDirection } from "@app/apis/types/sortdirection";
import { paginationLength } from "@default/pagination-length";
import { defaultSort } from "@default/sort";
import { db, usersTable } from "@postgres/index";
import { ResponseToolkit } from "@toolkit/response";
import { asc, desc, eq, ilike, or } from "drizzle-orm";

// Add your validation schema here if needed

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
			? or(ilike(usersTable.name, `%${search}%`))
			: undefined;

		const validateOrderBy = {
			id: usersTable.id,
			name: usersTable.name,
			email: usersTable.email,
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

	detail: async (ctx: AppContext) => {
		const userId = ctx.params.id;

		const user = await db.query.users.findFirst({
			where: eq(usersTable.id, userId),
			columns: {
				id: true,
				name: true,
				email: true,
				created_at: true,
				updated_at: true,
			},
		});

		if (!user) {
			return ResponseToolkit.notFound(ctx, "User not found");
		}

		return ResponseToolkit.success(ctx, user, "Success get user detail", 200);
	},

	// Implement create, update, delete as needed using db.query.users and transactions
};
