import { t } from "elysia";

export const RoleListSchema = t.Object({
	id: t.String({ format: "uuid", description: "Role unique identifier" }),
	name: t.String({ description: "Role name", examples: ["admin"] }),
	created_at: t.Date({ description: "Creation date" }),
	updated_at: t.Date({ description: "Last update date" }),
});

export const CreateRoleSchema = t.Object({
	name: t.String({
		description: "Role name",
		examples: ["editor"],
	}),
	permission_ids: t.Array(t.String({ format: "uuid" }), {
		description: "Array of permission UUIDs to assign",
	}),
});

export const UpdateRoleSchema = t.Object({
	name: t.String({
		description: "Role name",
		examples: ["editor"],
	}),
	permission_ids: t.Array(t.String({ format: "uuid" }), {
		description: "Array of permission UUIDs to assign",
	}),
});
