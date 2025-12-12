import { AuthHandler } from "@apis/handlers/auth.handler";
import Elysia from "elysia";

export const authRoutes = new Elysia({ prefix: "/auth" })
	.post("/login", AuthHandler.login)
	.post("/register", AuthHandler.register)
	.post("/verify-email", AuthHandler.verifyEmail)
	.post("/resent-verification-email", AuthHandler.resentVerificationEmail)
	.post("/forgot-password", AuthHandler.forgotPassword)
	.post("/reset-password", AuthHandler.resetPassword);
