import { db } from "@postgres/index";
import { usersTable } from "@postgres/user";
import { Hash } from "@security/hash";
import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { and, eq, isNotNull } from "drizzle-orm";
import { UserInformation } from "@apis/types/UserInformation";
import { AppContext } from "@apis/types/elysia";

const AuthSchema = {
	LoginSchema: vine.object({
		email: vine.string().email(),
		password: vine.string(),
	}),
};

export const AuthHandler = {
	login: async (ctx: AppContext) => {
		const payload = ctx.body as {
			email: string;
			password: string;
		};

		const validation = await vine.validate({
			schema: AuthSchema.LoginSchema,
			data: payload,
		});

		const user = await db
			.select({
				id: usersTable.id,
				name: usersTable.name,
				password: usersTable.password,
				email: usersTable.email,
			})
			.from(usersTable)
			.where(
				and(
					eq(usersTable.email, validation.email),
					isNotNull(usersTable.email_verified_at),
				),
			)
			.limit(1);

		if (user.length === 0) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "email",
					message: "Invalid email or password",
				},
			]);
		}

		const isPasswordValid = await Hash.compareHash(
			payload.password,
			user[0].password,
		);
		if (!isPasswordValid) {
			return ResponseToolkit.validationError(ctx, [
				{
					field: "password",
					message: "Invalid email or password",
				},
			]);
		}

		const JwtToken = await ctx.jwt.sign({
			id: user[0].id,
		});

		return ResponseToolkit.success<{
			user_information: UserInformation;
			access_token: string;
		}>(
			ctx,
			{
				user_information: {
					id: user[0].id,
					email: user[0].email,
					name: user[0].name,
				},
				access_token: JwtToken,
			},
			"Login successful",
			200,
		);
	},

	profile: (ctx: AppContext) => {
		return ResponseToolkit.success(
			ctx,
			ctx.user,
			"User profile retrieved",
			200,
		);
	},
};
