import Elysia from "elysia";
import { AuthHandler } from "@apis/handlers/auth.handler";

export const authRoutes = new Elysia({ prefix: "/auth" })
	.post("/login", AuthHandler.login)
	.post("/register", AuthHandler.register)
	.post("/verify-email", AuthHandler.verifyEmail)
	.post("/resent-verification-email", AuthHandler.resentVerificationEmail);
