import { relations } from "drizzle-orm";
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { users } from "./user";

export const emailVerifications = pgTable(
	"email_verifications",
	{
		id: uuid().primaryKey().defaultRandom(),
		user_id: uuid()
			.notNull()
			.references(() => users.id),
		token: varchar({ length: 255 }).notNull(),
		expired_at: timestamp().notNull(),
		created_at: timestamp().defaultNow(),
		updated_at: timestamp()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("email_verification_token_index").on(table.token)],
);

export const emailVerificationsRelations = relations(
	emailVerifications,
	({ one }) => ({
		user: one(users, {
			fields: [emailVerifications.user_id],
			references: [users.id],
		}),
	}),
);
