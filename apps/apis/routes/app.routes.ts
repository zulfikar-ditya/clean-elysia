import Elysia from "elysia";
import { HomeHandler } from "@apis/handlers/home.handler";
import { AuthHandler } from "@apis/handlers/auth.handler";
import { authMiddleware } from "@apis/middleware";
import { ProfileHandler } from "@apis/handlers/profile.handler";
import { AppContext } from "../types/elysia";
import { PermissionHandler } from "@apis/handlers/settings/permission.handler";
import { RoleHandler } from "../handlers/settings/role.handler";
import { SettingSelectHandler } from "../handlers/settings/select-options/select.handler";

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
		return {};
	});

	app.get("/profile", ProfileHandler.profile);
	app.patch("/profile", ProfileHandler.updateProfile);
	app.patch("/profile/password", ProfileHandler.updatePassword);

	app.group("/settings", (app) => {
		app.get("/permission", PermissionHandler.list);
		app.post("/permission", PermissionHandler.create);
		app.get("/permission/:id", PermissionHandler.detail);
		app.patch("/permission/:id", PermissionHandler.update);
		app.delete("/permission/:id", PermissionHandler.delete);

		app.get("/role", RoleHandler.list);
		app.post("/role", RoleHandler.create);
		app.get("/role/:id", RoleHandler.detail);
		app.patch("/role/:id", RoleHandler.update);
		app.delete("/role/:id", RoleHandler.delete);

		app.get("/select/permission", SettingSelectHandler.permissions);
		app.get("/select/role", SettingSelectHandler.roles);

		return app;
	});

	return app;
});

export default routes;
