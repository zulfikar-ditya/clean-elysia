import { jwt } from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import {
	UserInformation,
	UserInformationTypeBox,
} from "@app/apis/types/UserInformation";
import { AuthService } from "./service";
import { ResponseToolkit } from "@toolkit/response";
import { StrongPassword } from "@default/strong-password";
import { Cache, UserInformationCacheKey } from "@cache/*";
import { JWT_CONFIG } from "config/jwt.config";

export const AuthModule = new Elysia({
	prefix: "/auth",
})
	.use(jwt(JWT_CONFIG))
	.post(
		"/login",
		async ({ body, set, jwt }) => {
			const user: UserInformation = await AuthService.singIn(
				body.email,
				body.password,
			);

			const token = await jwt.sign({ id: user.id });
			const cacheKey = UserInformationCacheKey(user.id);
			await Cache.set(cacheKey, user, 3600);

			set.status = 200;
			return ResponseToolkit.success<{
				user: UserInformation;
				accessToken: string;
			}>({ user, accessToken: token }, "Successfully logged in", 200);
		},
		{
			body: t.Object({
				email: t.String({
					format: "email",
				}),
				password: t.String(),
			}),
			response: {
				200: t.Object({
					status: t.Number(),
					success: t.Boolean(),
					message: t.String(),
					data: t.Nullable(
						t.Object({
							user: UserInformationTypeBox,
							accessToken: t.String(),
						}),
					),
				}),
				400: t.Object({
					status: t.Number(),
					success: t.Boolean(),
					message: t.String(),
					errors: t.Array(
						t.Object({
							field: t.String(),
							message: t.String(),
						}),
					),
				}),
			},
			detail: {
				tags: ["Auth"],
			},
		},
	)
	.post(
		"/register",
		async ({ set, body }) => {
			await AuthService.register({
				name: body.name,
				email: body.email,
				password: body.password,
			});

			set.status = 201;
			return ResponseToolkit.success<null>(
				null,
				"Successfully registered",
				201,
			);
		},
		{
			body: t.Object({
				email: t.String({
					format: "email",
				}),
				name: t.String(),
				password: t.String({
					pattern: StrongPassword.source,
				}),
			}),
			response: {
				200: t.Object({
					status: t.Number(),
					success: t.Boolean(),
					message: t.String(),
					data: t.Nullable(t.Null()),
				}),
			},
			detail: {
				tags: ["Auth"],
			},
		},
	)
	.post(
		"resent-verification",
		async (ctx) => {
			const body = ctx.body;
			await AuthService.resentVerificationEmail(body.email);

			return ResponseToolkit.success<null>(
				null,
				"Verification email resent successfully",
				200,
			);
		},
		{
			body: t.Object({
				email: t.String({
					format: "email",
					maxLength: 255,
				}),
			}),
			response: {
				200: t.Object({
					status: t.Number(),
					success: t.Boolean(),
					message: t.String(),
					data: t.Nullable(t.Null()),
				}),
			},
			detail: {
				tags: ["Auth"],
			},
		},
	)
	.post(
		"/verify-email",
		async ({ body, set }) => {
			await AuthService.verifyEmail(body.token);

			set.status = 200;
			return ResponseToolkit.success<null>(
				null,
				"Email verified successfully",
				200,
			);
		},
		{
			body: t.Object({
				token: t.String(),
			}),
			response: {
				200: t.Object({
					status: t.Number(),
					success: t.Boolean(),
					message: t.String(),
					data: t.Nullable(t.Null()),
				}),
			},
			detail: {
				tags: ["Auth"],
			},
		},
	)
	.post(
		"/forgot-password",
		async ({ set, body }) => {
			await AuthService.forgotPassword(body.email);

			set.status = 200;
			return ResponseToolkit.success<null>(
				null,
				"Password reset email sent successfully",
				200,
			);
		},
		{
			body: t.Object({
				email: t.String({
					format: "email",
					maxLength: 255,
				}),
			}),
			response: {
				200: t.Object({
					status: t.Number(),
					success: t.Boolean(),
					message: t.String(),
					data: t.Nullable(t.Null()),
				}),
			},
			detail: {
				tags: ["Auth"],
			},
		},
	)
	.post(
		"/reset-password",
		async ({ set, body }) => {
			await AuthService.resetPassword(body.token, body.new_password);
			set.status = 200;

			return ResponseToolkit.success<null>(
				null,
				"Password has been reset successfully",
				200,
			);
		},
		{
			body: t.Object({
				token: t.String(),
				new_password: t.String({
					pattern: StrongPassword.source,
					maxLength: 255,
				}),
			}),
			response: {
				200: t.Object({
					status: t.Number(),
					success: t.Boolean(),
					message: t.String(),
					data: t.Nullable(t.Null()),
				}),
			},
			detail: {
				tags: ["Auth"],
			},
		},
	);
