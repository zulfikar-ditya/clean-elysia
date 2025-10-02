import { db, passwordResetPasswordTable } from "@postgres/index";
import { eq } from "drizzle-orm";

export const ForgotPasswordRepository = () => {
	const dbInstance = db;

	return {
		db: dbInstance,

		create: async (data: { user_id: string; token: string }) => {
			await dbInstance.insert(passwordResetPasswordTable).values({
				token: data.token,
				user_id: data.user_id,
			});
		},

		findByToken: async (token: string) => {
			return await dbInstance.query.password_reset_tokens.findFirst({
				where: eq(passwordResetPasswordTable.token, token),
			});
		},
	};
};
