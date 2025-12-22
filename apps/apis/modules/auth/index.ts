import { jwt } from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import {
	UserInformation,
	UserInformationTypeBox,
} from "@app/apis/types/UserInformation";
import { AuthService } from "./service";
import {
	ResponseToolkit,
	SuccessResponseSchema,
	CommonResponseSchemas,
} from "@toolkit/response";
import { StrongPassword } from "@default/strong-password";
import { Cache, UserInformationCacheKey } from "@cache/*";
import { JWT_CONFIG } from "config/jwt.config";

const LoginResponseSchema = t.Object({
	user: UserInformationTypeBox,
	accessToken: t.String(),
});

export const AuthModule = new Elysia({
	prefix: "/auth",
	detail: { tags: ["Authentication"] },
})
	.use(jwt(JWT_CONFIG))

	// ============================================
	// LOGIN
	// ============================================
	.post(
		"/login",
		async ({ body, jwt, set }) => {
			try {
				const user: UserInformation = await AuthService.singIn(
					body.email,
					body.password,
				);

				const token = await jwt.sign({ id: user.id });
				const cacheKey = UserInformationCacheKey(user.id);
				await Cache.set(cacheKey, user, 3600);

				set.status = 200;
				return ResponseToolkit.success(
					{
						user,
						accessToken: token,
					},
					"Successfully logged in",
				);
			} catch (error) {
				throw error;
			}
		},
		{
			body: t.Object({
				email: t.String({
					format: "email",
					error: "Invalid email format",
				}),
				password: t.String({
					minLength: 1,
					error: "Password is required",
				}),
			}),
			response: {
				200: SuccessResponseSchema(LoginResponseSchema),
				400: t.Object({
					status: t.Literal(400),
					success: t.Literal(false),
					message: t.String(),
					errors: t.Array(
						t.Object({
							field: t.String(),
							message: t.String(),
						}),
					),
				}),
				422: CommonResponseSchemas[422],
			},
			detail: {
				summary: "User login",
				description: "Authenticate user with email and password",
			},
		},
	)

	// ============================================
	// REGISTER
	// ============================================
	.post(
		"/register",
		async ({ set, body }) => {
			try {
				await AuthService.register({
					name: body.name,
					email: body.email,
					password: body.password,
				});

				set.status = 201;
				return ResponseToolkit.created(
					null,
					"Successfully registered. Please check your email to verify your account.",
				);
			} catch (error) {
				throw error;
			}
		},
		{
			body: t.Object({
				email: t.String({
					format: "email",
					error: "Invalid email format",
				}),
				name: t.String({
					minLength: 1,
					maxLength: 255,
					error: "Name is required and must be less than 255 characters",
				}),
				password: t.String({
					pattern: StrongPassword.source,
					minLength: 8,
					error:
						"Password must be at least 8 characters and contain uppercase, lowercase, number and special character",
				}),
			}),
			response: {
				201: SuccessResponseSchema(t.Null()),
				400: t.Object({
					status: t.Literal(400),
					success: t.Literal(false),
					message: t.String(),
					errors: t.Array(
						t.Object({
							field: t.String(),
							message: t.String(),
						}),
					),
				}),
				422: CommonResponseSchemas[422],
			},
			detail: {
				summary: "User registration",
				description: "Register a new user account",
			},
		},
	)

	// ============================================
	// RESEND VERIFICATION EMAIL
	// ============================================
	.post(
		"/resend-verification",
		async ({ body }) => {
			await AuthService.resentVerificationEmail(body.email);

			return ResponseToolkit.success(
				null,
				"If the email exists, a verification link has been sent. Please check your inbox.",
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
				200: SuccessResponseSchema(t.Null()),
			},
			detail: {
				summary: "Resend verification email",
				description: "Request a new email verification link",
			},
		},
	)

	// ============================================
	// VERIFY EMAIL
	// ============================================
	.post(
		"/verify-email",
		async ({ body }) => {
			try {
				await AuthService.verifyEmail(body.token);

				return ResponseToolkit.success(
					null,
					"Email verified successfully. You can now log in.",
				);
			} catch (error) {
				throw error;
			}
		},
		{
			body: t.Object({
				token: t.String({
					minLength: 1,
				}),
			}),
			response: {
				200: SuccessResponseSchema(t.Null()),
				400: t.Object({
					status: t.Literal(400),
					success: t.Literal(false),
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
				summary: "Verify email address",
				description: "Verify user's email address with token",
			},
		},
	)

	// ============================================
	// FORGOT PASSWORD
	// ============================================
	.post(
		"/forgot-password",
		async ({ body }) => {
			await AuthService.forgotPassword(body.email);

			return ResponseToolkit.success(
				null,
				"If the email exists, a password reset link has been sent. Please check your inbox.",
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
				200: SuccessResponseSchema(t.Null()),
			},
			detail: {
				summary: "Request password reset",
				description: "Send password reset email to user",
			},
		},
	)

	// ============================================
	// RESET PASSWORD
	// ============================================
	.post(
		"/reset-password",
		async ({ body }) => {
			try {
				await AuthService.resetPassword(body.token, body.new_password);

				return ResponseToolkit.success(
					null,
					"Password has been reset successfully. You can now log in with your new password.",
				);
			} catch (error) {
				throw error;
			}
		},
		{
			body: t.Object({
				token: t.String({
					minLength: 1,
				}),
				new_password: t.String({
					pattern: StrongPassword.source,
					minLength: 8,
					maxLength: 255,
				}),
			}),
			response: {
				200: SuccessResponseSchema(t.Null()),
				400: t.Object({
					status: t.Literal(400),
					success: t.Literal(false),
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
				summary: "Reset password",
				description: "Reset user password with token",
			},
		},
	);
