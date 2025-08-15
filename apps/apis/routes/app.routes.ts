import Elysia from "elysia";
import { HomeHandler } from "@apis/handlers/home.handler";
import { AuthHandler } from "@apis/handlers/auth.handler";
import { authMiddleware } from "@apis/middleware";

const routes = new Elysia();

routes.get("/", HomeHandler.home);
routes.get("/health", HomeHandler.health);

// authenticate
routes.post("/auth/login", AuthHandler.login);

// AUTHENTICATE HANDLER
routes.group("", (app) => {
	app.derive(async (ctxt) => {
		await authMiddleware(ctx);
		return ctx;
	});

	app.get("/profile", AuthHandler.profile);
	return app;
});

export default routes;
