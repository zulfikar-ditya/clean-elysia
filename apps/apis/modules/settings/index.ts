import Elysia from "elysia";

import { PermissionModule } from "./permission";
import { RoleModule } from "./role";
import { SelectOptionModule } from "./select-option";
import { UserModule } from "./user";

export const SettingsModule = new Elysia({
	prefix: "/settings",
	detail: {
		tags: ["Settings"],
	},
})
	.use(SelectOptionModule)
	.use(PermissionModule)
	.use(RoleModule)
	.use(UserModule);
