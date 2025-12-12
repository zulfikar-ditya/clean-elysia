import routes from "@apis/routes/app.routes";
import { errorHandler } from "@app/apis/middleware/error-handler";
import { setupMiddlewares } from "@app/apis/middleware/setup";
import { AppConfig } from "@config";
import { log } from "@packages";
import { Elysia } from "elysia";

const app = new Elysia()
	.use(setupMiddlewares)
	.use(routes)
	.use(errorHandler)
	.listen(AppConfig.APP_PORT);

export default app.fetch;

log.info({}, `application running on port ${AppConfig.APP_PORT}`);
