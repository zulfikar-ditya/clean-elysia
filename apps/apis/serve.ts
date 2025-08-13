import cors from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import { AppConfig, CORSConfig } from "@packages";

import { Elysia } from "elysia";
import { UnauthorizedError } from "@apis/errors/unauthorized-error";
import routes from "@apis/routes/app.routes";

const app = new Elysia()
	.onError(({ code, error, set }) => {
		switch (code) {
			case "NOT_FOUND":
				return {
					status: 404,
					success: false,
					message: "Page not found",
					data: null,
				};
			case "INTERNAL_SERVER_ERROR":
				return {
					status: 500,
					success: false,
					message: "Internal Server Error",
					data: null,
				};
			case "UNKNOWN":
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

				return error;
		}
	})
	// .onAfterResponse(({ set, path, request }) => {
	// 	// TODO Logger
	// })
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
