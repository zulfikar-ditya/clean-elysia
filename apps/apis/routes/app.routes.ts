import Elysia from "elysia";
import { HomeHandler } from "@apis/handlers/home.handler";
import { authRoutes } from "./auth.routes";
import { profileRoutes } from "./profile.routes";
import { settingRoutes } from "./setting.routes";

const routes = new Elysia();

routes.get("/", HomeHandler.home);
routes.get("/health", HomeHandler.health);

routes.use(authRoutes);
routes.use(profileRoutes);
routes.use(settingRoutes);

export default routes;
