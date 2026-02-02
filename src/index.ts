import { AppConfig } from "@config";
import { DocsPlugin, log } from "@packages";
import { Elysia } from "elysia";

import { bootstraps } from "./modules/index";

const app = new Elysia()
	.use(DocsPlugin)
	.use(bootstraps)
	.listen(AppConfig.APP_PORT);

export default app.fetch;

log.info({}, `application running on port ${AppConfig.APP_PORT}`);
