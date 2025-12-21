import { errorHandler } from "@app/apis/middleware/error-handler";
import { setupMiddlewares } from "@app/apis/middleware/setup";
import { AppConfig } from "@config";
import { log } from "@packages";
import { Elysia } from "elysia";
import { bootstraps } from "./modules/index";
import openapi from "@elysiajs/openapi";

const app = new Elysia()
	.use(
		openapi({
			path: "/docs",
			documentation: {
				info: {
					title: `API ${AppConfig.APP_NAME}`,
					version: "1.0.0",
					description: `API documentation for ${AppConfig.APP_NAME}`,
					license: {
						name: "MIT",
						url: "https://opensource.org/license/mit/",
					},
				},
			},
			enabled: AppConfig.APP_ENV !== "production",
		}),
	)
	.use(setupMiddlewares)
	.use(errorHandler)
	.use(bootstraps)
	.listen(AppConfig.APP_PORT);

export default app.fetch;

log.info({}, `application running on port ${AppConfig.APP_PORT}`);
