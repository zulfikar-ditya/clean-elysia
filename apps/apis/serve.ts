import cors from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import { AppConfig, CORSConfig, log, LoggerPlugin } from "@packages";

import { Elysia } from "elysia";
import { UnauthorizedError } from "@apis/errors/unauthorized-error";
import routes from "@apis/routes/app.routes";

const app = new Elysia()
	.derive(() => ({
		requestId:
			globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
		startedAt: Date.now(),
	}))
	.use(LoggerPlugin)
	.onError(({ code, error, set, log: ctxLog }) => {
		switch (code) {
			case "NOT_FOUND":
				return {
					status: 404,
					success: false,
					message: "Page not found",
					data: null,
				};
			case "INTERNAL_SERVER_ERROR":
				ctxLog?.error({ code, err: error }, "internal server error");
				return {
					status: 500,
					success: false,
					message: "Internal Server Error",
					data: null,
				};
			case "UNKNOWN":
				ctxLog?.error({ code, err: error }, "unhandled error");
				return {
					status: 500,
					success: false,
					message: "An unknown error occurred",
					data: null,
				};
			default:
				if (error instanceof UnauthorizedError) {
					set.status = 401;
					return {
						status: 401,
						success: false,
						message: error.message,
						data: null,
					};
				}

				ctxLog?.error({ code, err: error }, "error occurred");

				return error;
		}
	})
	.use(
		jwt({
			alg: "HS256",
			secret: AppConfig.APP_JWT_SECRET,
		}),
	)
	.use(cors(CORSConfig))
	.listen(AppConfig.APP_PORT);

// routes
app.use(routes);

export default app.fetch;

// console.log(`Server started in ${AppConfig.APP_URL}`);
log.info({}, `application running on port ${AppConfig.APP_PORT}`);
