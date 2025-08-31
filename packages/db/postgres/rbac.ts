import { relations } from "drizzle-orm";
import {
	pgTable,
	uuid,
	varchar,
	primaryKey,
	timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const roleTable = pgTable("roles", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roleRelations = relations(roleTable, ({ many }) => ({
	permissions: many(rolePermissionTable, {
		relationName: "permissions",
	}),
	users: many(userRolesTable),
}));

export const permissionTable = pgTable("permissions", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull().unique(),
	group: varchar("group", { length: 100 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const permissionRelations = relations(permissionTable, ({ many }) => ({
	roles: many(rolePermissionTable),
}));

export const rolePermissionTable = pgTable(
	"role_permissions",
	{
		roleId: uuid("role_id")
			.notNull()
			.references(() => roleTable.id),
		permissionId: uuid("permission_id")
			.notNull()
			.references(() => permissionTable.id),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
	}),
);

export const rolePermissionRelations = relations(
	rolePermissionTable,
	({ one }) => ({
		role: one(roleTable, {
			fields: [rolePermissionTable.roleId],
			references: [roleTable.id],
		}),
		permission: one(permissionTable, {
			fields: [rolePermissionTable.permissionId],
			references: [permissionTable.id],
		}),
	}),
);

export const userRolesTable = pgTable(
	"user_roles",
	{
		userId: uuid("user_id").notNull(),
		roleId: uuid("role_id")
			.notNull()
			.references(() => roleTable.id),
		assignedAt: timestamp("assigned_at").defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.userId, table.roleId] }),
	}),
);

export const userRolesRelations = relations(userRolesTable, ({ many }) => ({
	users: many(usersTable),
	roles: many(roleTable),
}));

export type Role = typeof roleTable.$inferSelect;
export type Permission = typeof permissionTable.$inferSelect;
export type RolePermission = typeof rolePermissionTable.$inferSelect;
export type UserRole = typeof userRolesTable.$inferSelect;
