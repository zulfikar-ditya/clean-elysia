import Elysia from "elysia";

import { AuthModule } from "./auth";
import { HomeModule } from "./home";
import { ProfileModule } from "./profile";
import { SettingsModule } from "./settings";

export const bootstraps = new Elysia()
	.use(HomeModule)
	.use(AuthModule)
	.use(ProfileModule)
	.use(SettingsModule);
