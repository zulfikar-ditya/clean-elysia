import { setupMiddlewares } from "@app/apis/middleware/setup";
import { AppConfig } from "@config";
import { log } from "@packages";
import { Elysia } from "elysia";
import { bootstraps } from "./modules/index";

const app = new Elysia()
	.use(setupMiddlewares)
	.use(bootstraps)
	.listen(AppConfig.APP_PORT);

export default app.fetch;

log.info({}, `application running on port ${AppConfig.APP_PORT}`);
