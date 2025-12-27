import { t } from "elysia";

export const PermissionCreateSchema = t.Object({
	name: t.Array(t.String({ minLength: 1, maxLength: 255 })),
	group: t.String({ minLength: 1, maxLength: 100 }),
});

export const PermissionUpdateSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 255 }),
	group: t.String({ minLength: 1, maxLength: 100 }),
});

export const PermissionListSchema = t.Object({
	id: t.String({ format: "uuid" }),
	name: t.String(),
	group: t.String(),
	created_at: t.Date(),
	updated_at: t.Date(),
});
