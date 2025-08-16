import Elysia from "elysia";
import { HomeHandler } from "@apis/handlers/home.handler";
import { AuthHandler } from "@apis/handlers/auth.handler";
import { authMiddleware } from "@apis/middleware";
import { ProfileHandler } from "@apis/handlers/profile.handler";
import { AppContext } from "../types/elysia";

const routes = new Elysia();

routes.get("/", HomeHandler.home);
routes.get("/health", HomeHandler.health);

// authenticate
routes.post("/auth/login", AuthHandler.login);
routes.post("/auth/register", AuthHandler.register);
routes.post("/auth/verify-email", AuthHandler.verifyEmail);
routes.post(
	"/auth/resent-verification-email",
	AuthHandler.resentVerificationEmail,
);

// AUTHENTICATE HANDLER
routes.group("", (app) => {
	app.derive(async (ctx) => {
		await authMiddleware(ctx as AppContext);
		return ctx;
	});

	app.get("/profile", ProfileHandler.profile);
	app.patch("/profile", ProfileHandler.updateProfile);
	app.patch("/profile/password", ProfileHandler.updatePassword);
	return app;
});

export default routes;
