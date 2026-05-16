import { sql } from "drizzle-orm";
import {
	foreignKey,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

export const userStatus = pgEnum("UserStatus", [
	"ACTIVE",
	"INACTIVE",
	"BLOCKED",
]);

export const prismaMigrations = pgTable("_prisma_migrations", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: "string" }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp("rolled_back_at", {
		withTimezone: true,
		mode: "string",
	}),
	startedAt: timestamp("started_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const role = pgTable(
	"Role",
	{
		id: text().primaryKey().notNull(),
		name: varchar({ length: 255 }).notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
	},
	(table) => [
		uniqueIndex("Role_name_key").using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
		),
	],
);

export const permission = pgTable(
	"Permission",
	{
		id: text().primaryKey().notNull(),
		name: varchar({ length: 255 }).notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		group: varchar({ length: 255 }).notNull(),
	},
	(table) => [
		uniqueIndex("Permission_name_key").using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
		),
	],
);

export const user = pgTable(
	"User",
	{
		id: text().primaryKey().notNull(),
		name: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }).notNull(),
		password: varchar({ length: 255 }).notNull(),
		emailVerifiedAt: timestamp({ precision: 3, mode: "string" }),
		status: userStatus().default("ACTIVE").notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
	},
	(table) => [
		uniqueIndex("User_email_key").using(
			"btree",
			table.email.asc().nullsLast().op("text_ops"),
		),
	],
);

export const userEmailVerification = pgTable(
	"UserEmailVerification",
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		token: varchar({ length: 255 }).notNull(),
		expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserEmailVerification_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
	],
);

export const passwordReset = pgTable(
	"PasswordReset",
	{
		id: text().primaryKey().notNull(),
		userId: text().notNull(),
		token: varchar({ length: 255 }).notNull(),
		expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "PasswordReset_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
	],
);

export const userRole = pgTable(
	"UserRole",
	{
		userId: text().notNull(),
		roleId: text().notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserRole_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
		foreignKey({
			columns: [table.roleId],
			foreignColumns: [role.id],
			name: "UserRole_roleId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
		primaryKey({
			columns: [table.userId, table.roleId],
			name: "UserRole_pkey",
		}),
	],
);

export const rolePermission = pgTable(
	"RolePermission",
	{
		roleId: text().notNull(),
		permissionId: text().notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.roleId],
			foreignColumns: [role.id],
			name: "RolePermission_roleId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
		foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permission.id],
			name: "RolePermission_permissionId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("restrict"),
		primaryKey({
			columns: [table.roleId, table.permissionId],
			name: "RolePermission_pkey",
		}),
	],
);
