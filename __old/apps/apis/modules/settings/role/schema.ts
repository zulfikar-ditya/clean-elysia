import { t } from "elysia";

export const RoleListSchema = t.Object({
	id: t.String({ format: "uuid" }),
	name: t.String(),
	created_at: t.Date(),
	updated_at: t.Date(),
});

export const CreateRoleSchema = t.Object({
	name: t.String(),
	permission_ids: t.Array(t.String({ format: "uuid" })),
});

export const UpdateRoleSchema = t.Object({
	name: t.String(),
	permission_ids: t.Array(t.String({ format: "uuid" })),
});
