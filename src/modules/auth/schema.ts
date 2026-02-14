import { StrongPassword } from "@default";
import { UserInformationTypeBox } from "@types";
import { t } from "elysia";

export const LoginSchema = t.Object({
	email: t.String({
		format: "email",
		description: "User email address",
		examples: ["user@example.com"],
	}),
	password: t.String({
		minLength: 1,
		description: "User password for authentication",
		examples: ["MySecurePass123!"],
	}),
});

export const LoginResponseSchema = t.Object({
	user: UserInformationTypeBox,
	accessToken: t.String({
		description: "JWT access token for authenticated requests",
		examples: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
	}),
});

export const RegisterSchema = t.Object({
	email: t.String({
		format: "email",
		description: "Valid email address",
		examples: ["user@example.com"],
	}),
	name: t.String({
		minLength: 1,
		maxLength: 255,
		description: "User full name",
		examples: ["John Doe"],
	}),
	password: t.String({
		pattern: StrongPassword.source,
		minLength: 8,
		description:
			"Strong password with uppercase, lowercase, number, and special character",
		examples: ["MySecure123!"],
	}),
});

export const ResendVerificationEmailSchema = t.Object({
	email: t.String({
		format: "email",
		maxLength: 255,
		description: "Email address to resend verification to",
		examples: ["user@example.com"],
	}),
});

export const VerifyEmailSchema = t.Object({
	token: t.String({
		minLength: 1,
		description: "Email verification token",
		examples: ["abc123def456"],
	}),
});

export const ForgotPasswordSchema = t.Object({
	email: t.String({
		format: "email",
		maxLength: 255,
		description: "Email address associated with the account",
		examples: ["user@example.com"],
	}),
});

export const ResetPasswordSchema = t.Object({
	token: t.String({
		minLength: 1,
		description: "Password reset token from email",
		examples: ["reset-token-abc123"],
	}),
	newPassword: t.String({
		pattern: StrongPassword.source,
		minLength: 8,
		description:
			"New strong password with uppercase, lowercase, number, and special character",
		examples: ["NewSecure123!"],
	}),
});
