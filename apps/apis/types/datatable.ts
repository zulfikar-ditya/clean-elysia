import { t } from "elysia";

export type SortDirection = "asc" | "desc";

export type DatatableType = {
	page: number;
	limit: number;
	search: string | null;
	sort: string;
	sortDirection: SortDirection;

	// e.g ?filter[name]=John&filter[age]=30
	filter: Record<string, boolean | string | Date> | null;

	// NOTE: This is just an example, you can add more fields here
	// fields=name,age
	// exclude=name,age
	// include=name,age
};

export const DatatableQueryParams = t.Object({
	page: t.Number({
		default: 1,
	}),
	limit: t.Number({
		default: 10,
	}),
	search: t.Optional(t.String()),
	sort: t.Optional(
		t.String({
			default: "created_at",
		}),
	),
	sortDirection: t.Union([t.Literal("asc"), t.Literal("desc")], {
		default: "asc",
	}),
	filter: t.Optional(
		t.Record(
			t.String(),
			t.Union([t.String(), t.Boolean(), t.String()]), // Date can be passed as string
		),
	),
});
