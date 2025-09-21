import Elysia from "elysia";
import { HomeHandler } from "@apis/handlers/home.handler";
import { AuthHandler } from "@apis/handlers/auth.handler";
import { authMiddleware } from "@apis/middleware";
import { ProfileHandler } from "@apis/handlers/profile.handler";
import { AppContext } from "../types/elysia";
import { PermissionHandler } from "@apis/handlers/settings/permission.handler";
import { RoleHandler } from "../handlers/settings/role.handler";
import { SettingSelectHandler } from "../handlers/settings/select-options/select.handler";
import { UserHandler } from "../handlers/settings/user.handler";
import { roleMiddleware } from "../middleware/role.middleware";

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

	app.group("/settings", (settingRoutes) => {
		settingRoutes.derive((ctx) => {
			roleMiddleware(ctx as AppContext, []);
			return {};
		});

		settingRoutes.get("/permission", PermissionHandler.list);
		settingRoutes.post("/permission", PermissionHandler.create);
		settingRoutes.get("/permission/:id", PermissionHandler.detail);
		settingRoutes.patch("/permission/:id", PermissionHandler.update);
		settingRoutes.delete("/permission/:id", PermissionHandler.delete);

		settingRoutes.get("/role", RoleHandler.list);
		settingRoutes.post("/role", RoleHandler.create);
		settingRoutes.get("/role/:id", RoleHandler.detail);
		settingRoutes.patch("/role/:id", RoleHandler.update);
		settingRoutes.delete("/role/:id", RoleHandler.delete);

		settingRoutes.get("/user", UserHandler.list);
		settingRoutes.post("/user", UserHandler.create);
		settingRoutes.get("/user/:id", UserHandler.detail);
		settingRoutes.patch("/user/:id", UserHandler.update);
		settingRoutes.delete("/user/:id", UserHandler.delete);

		settingRoutes.get("/select/permission", SettingSelectHandler.permissions);
		settingRoutes.get("/select/role", SettingSelectHandler.roles);

		return settingRoutes;
	});

	return app;
});

export default routes;
