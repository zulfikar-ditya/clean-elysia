import { ResponseToolkit } from "@toolkit/response";
import vine from "@vinejs/vine";
import { UserInformation } from "@apis/types/UserInformation";
import { AppContext } from "@apis/types/elysia";
import { StrongPassword } from "@default/strong-password";
import { Cache, UserInformationCacheKey } from "@packages_cache/*";
import { AuthService } from "../services/auth.service";

const AuthSchema = {
	LoginSchema: vine.object({
		email: vine.string().email().normalizeEmail(),
		password: vine.string().minLength(1),
	}),

	RegisterSchema: vine.object({
		email: vine.string().email().normalizeEmail().maxLength(255),
		name: vine.string().trim().minLength(1).maxLength(255),
		password: vine.string().regex(StrongPassword),
	}),

	VerifyEmailSchema: vine.object({
		token: vine.string().trim().minLength(1).maxLength(255),
	}),

	ResentVerificationEmailSchema: vine.object({
		email: vine.string().email().normalizeEmail().maxLength(255),
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

		const user: UserInformation = await AuthService.login(
			validation.email,
			validation.password,
		);

		const cacheKey = UserInformationCacheKey(user.id);
		await Cache.set(cacheKey, user, 60 * 60);

		/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
		const JwtToken = await ctx.jwt.sign({
			id: user.id,
		});

		return ResponseToolkit.success<{
			user_information: UserInformation;
			access_token: string;
		}>(
			ctx,
			{
				user_information: user,
				access_token: JwtToken,
			},
			"Login successful",
			200,
		);
	},

	register: async (ctx: AppContext) => {
		const payload = ctx.body as {
			name: string;
			email: string;
			password: string;
		};

		const validate = await vine.validate({
			schema: AuthSchema.RegisterSchema,
			data: payload,
		});

		await AuthService.register(validate);

		return ResponseToolkit.success(
			ctx,
			{},
			"Registration successful. Please check your email to verify your account.",
			201,
		);
	},

	resentVerificationEmail: async (ctx: AppContext) => {
		const payload = ctx.body as {
			email: string;
		};

		const validate = await vine.validate({
			schema: AuthSchema.ResentVerificationEmailSchema,
			data: payload,
		});

		await AuthService.resentVerificationEmail(validate.email);

		return ResponseToolkit.success(ctx, {}, "Verification email sent", 200);
	},

	verifyEmail: async (ctx: AppContext) => {
		const payload = ctx.body as {
			token: string;
		};

		const validate = await vine.validate({
			schema: AuthSchema.VerifyEmailSchema,
			data: payload,
		});

		await AuthService.verifyEmail(validate.token);

		return ResponseToolkit.success(ctx, {}, "Email verified successfully", 200);
	},
};
