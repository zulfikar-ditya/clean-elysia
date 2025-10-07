import { db, password_reset_tokensTable } from "infra/postgres/index";
import { eq } from "drizzle-orm";

export const ForgotPasswordRepository = () => {
	const dbInstance = db;

	return {
		db: dbInstance,

		create: async (data: { user_id: string; token: string }) => {
			await dbInstance.insert(password_reset_tokensTable).values({
				token: data.token,
				user_id: data.user_id,
			});
		},

		findByToken: async (token: string) => {
			return await dbInstance.query.password_reset_tokens.findFirst({
				where: eq(password_reset_tokensTable.token, token),
			});
		},
	};
};
