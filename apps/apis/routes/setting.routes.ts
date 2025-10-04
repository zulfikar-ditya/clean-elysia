import Elysia from "elysia";
import { authMiddleware } from "@apis/middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { PermissionHandler } from "@apis/handlers/settings/permission.handler";
import { RoleHandler } from "../handlers/settings/role.handler";
import { UserHandler } from "../handlers/settings/user.handler";
import { SettingSelectHandler } from "../handlers/settings/select-options/select.handler";
import { AppContext } from "../types/elysia";

export const settingRoutes = new Elysia({ prefix: "/settings" })
	.derive(async (ctx) => {
		await authMiddleware(ctx as AppContext);
		return {};
	})
	.derive((ctx) => {
		roleMiddleware(ctx as AppContext, []);
		return {};
	})
	.get("/permission", PermissionHandler.list)
	.post("/permission", PermissionHandler.create)
	.get("/permission/:id", PermissionHandler.detail)
	.patch("/permission/:id", PermissionHandler.update)
	.delete("/permission/:id", PermissionHandler.delete)
	.get("/role", RoleHandler.list)
	.post("/role", RoleHandler.create)
	.get("/role/:id", RoleHandler.detail)
	.patch("/role/:id", RoleHandler.update)
	.delete("/role/:id", RoleHandler.delete)
	.get("/user", UserHandler.list)
	.post("/user", UserHandler.create)
	.get("/user/:id", UserHandler.detail)
	.patch("/user/:id", UserHandler.update)
	.delete("/user/:id", UserHandler.delete)
	.get("/select/permission", SettingSelectHandler.permissions)
	.get("/select/role", SettingSelectHandler.roles);
