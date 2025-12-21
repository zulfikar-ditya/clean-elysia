import Elysia from "elysia";
import { AuthModule } from "./auth";
import { ProfileModule } from "./profile";
import { HomeModule } from "./home";
import { SettingsModule } from "./settings";

export const bootstraps = new Elysia()
	.use(HomeModule)
	.use(AuthModule)
	.use(ProfileModule)
	.use(SettingsModule);
