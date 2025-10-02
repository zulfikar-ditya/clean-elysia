import { AppConfig, log } from "@packages";
import { Elysia } from "elysia";
import routes from "@apis/routes/app.routes";
import { setupMiddlewares } from "@app/apis/middleware/setup";
import { errorHandler } from "@app/apis/middleware/error-handler";

const app = new Elysia()
	.use(setupMiddlewares)
	.use(routes)
	.use(errorHandler)
	.listen(AppConfig.APP_PORT);

export default app.fetch;

log.info({}, `application running on port ${AppConfig.APP_PORT}`);
