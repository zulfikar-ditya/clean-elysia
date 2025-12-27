import Elysia from "elysia";

import { PermissionModule } from "./permission";

export const SettingsModule = new Elysia({
	prefix: "/settings",
	detail: {
		tags: ["Settings"],
	},
}).use(PermissionModule);
