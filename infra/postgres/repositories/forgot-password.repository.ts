import { eq } from "drizzle-orm";

import { db, password_reset_tokensTable } from "..";
import { DbTransaction } from ".";

export const ForgotPasswordRepository = () => {
	const dbInstance = db;

	return {
		db: dbInstance,
		getDb: (tx?: DbTransaction) => tx || dbInstance.$cache,
		getTable: () => password_reset_tokensTable,

		create: async (
			data: { user_id: string; token: string },
			tx?: DbTransaction,
		) => {
			const database = tx || dbInstance;
			await database.insert(password_reset_tokensTable).values({
				token: data.token,
				user_id: data.user_id,
			});
		},

		findByToken: async (token: string, tx?: DbTransaction) => {
			const database = tx || dbInstance;
			return await database.query.password_reset_tokens.findFirst({
				where: eq(password_reset_tokensTable.token, token),
			});
		},
	};
};
