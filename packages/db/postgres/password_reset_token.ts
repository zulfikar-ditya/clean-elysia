import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./user";
import { relations } from "drizzle-orm";

export const passwordResetPasswordTable = pgTable(
	"password_reset_tokens",
	{
		id: uuid().primaryKey().defaultRandom(),
		user_id: uuid()
			.notNull()
			.references(() => usersTable.id),
		token: varchar({ length: 255 }).notNull(),
		created_at: timestamp().defaultNow(),
		updated_at: timestamp()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("password_reset_token_token_index").on(table.token)],
);

export const passwordResetTokenRelations = relations(
	passwordResetPasswordTable,
	({ one }) => ({
		user: one(usersTable, {
			fields: [passwordResetPasswordTable.user_id],
			references: [usersTable.id],
		}),
	}),
);
