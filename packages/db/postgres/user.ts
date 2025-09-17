import { relations } from "drizzle-orm";
import {
	index,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { emailVerificationTable } from "./email_verification";
import { passwordResetPasswordTable } from "./password_reset_token";
import { userRolesTable } from "./rbac";

export const userStatusEnum = pgEnum("user_status", [
	"active",
	"inactive",
	"suspended",
	"blocked",
]);

export const usersTable = pgTable(
	"users",
	{
		id: uuid().primaryKey().defaultRandom(),
		name: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }).notNull(),
		status: userStatusEnum().default("active"),
		remark: varchar({ length: 255 }),
		password: varchar({ length: 255 }).notNull(),
		email_verified_at: timestamp(),
		deleted_at: timestamp(),
		created_at: timestamp().defaultNow(),
		updated_at: timestamp()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("users_email_deleted_at_status_index").on(
			table.email,
			table.deleted_at,
			table.status,
		),
	],
);

export const usersRelations = relations(usersTable, ({ many }) => ({
	email_verifications: many(emailVerificationTable),
	password_reset_tokens: many(passwordResetPasswordTable),
	user_roles: many(userRolesTable),
}));
