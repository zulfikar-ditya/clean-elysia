import Elysia from "elysia";
import { HomeHandler } from "@apis/handlers/home.handler";

const routes = new Elysia();

routes.get("/", HomeHandler.home);
routes.get("/health", HomeHandler.health);

export default routes;
