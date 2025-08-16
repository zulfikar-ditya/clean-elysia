import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const emailVerificationTable = pgTable(
	"email_verifications",
	{
		id: uuid().primaryKey().defaultRandom(),
		user_id: uuid()
			.notNull()
			.references(() => usersTable.id),
		token: varchar({ length: 255 }).notNull(),
		expired_at: timestamp().notNull(),
		created_at: timestamp().defaultNow(),
		updated_at: timestamp()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("email_verification_token_index").on(table.token)],
);
