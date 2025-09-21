import cors from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import { AppConfig, CORSConfig, log, LoggerPlugin } from "@packages";

import { Elysia } from "elysia";
import { UnauthorizedError } from "@apis/errors/unauthorized-error";
import routes from "@apis/routes/app.routes";
import { errors } from "@vinejs/vine";
import { ForbiddenError, UnprocessableEntityError } from "./errors";
import { NotFoundError } from "./errors/not-found-error";

const app = new Elysia()
	.derive(() => ({
		requestId:
			globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
		startedAt: Date.now(),
	}))
	.use(LoggerPlugin)
	.use(
		jwt({
			name: "jwt",
			alg: "HS256",
			secret: AppConfig.APP_JWT_SECRET,
		}),
	)
	.use(cors(CORSConfig))
	.use(routes)
	.onError(({ code, error, log: ctxLog, set }) => {
		// Use set.status to set the response status code
		if (error instanceof errors.E_VALIDATION_ERROR) {
			set.status = 422;
			const errorMessages = (
				error.messages as { field: string; message: string }[]
			).map((msg: { field: string; message: string }) => ({
				field: msg.field,
				message: msg.message,
			}));

			return {
				status: 422,
				success: false,
				message: errorMessages[0]?.message || "Validation error",
				errors: errorMessages,
			};
		}

		if (error instanceof UnprocessableEntityError) {
			set.status = 422;
			const errorMessages =
				typeof error.error === "string"
					? [{ field: "general", message: error.error }]
					: error.error || [];

			return {
				status: 422,
				success: false,
				message: error.message || "Unprocessable Entity",
				errors: errorMessages,
			};
		}

		if (error instanceof NotFoundError) {
			set.status = 404;
			return {
				status: 404,
				success: false,
				message: error.message || "Not Found",
			};
		}

		if (error instanceof UnauthorizedError) {
			set.status = 401;
			return {
				status: 401,
				success: false,
				message: error.message,
				data: null,
			};
		}

		if (error instanceof ForbiddenError) {
			set.status = 403;
			return {
				status: 403,
				success: false,
				message: error.message,
				data: null,
			};
		}

		switch (code) {
			case "NOT_FOUND":
				set.status = 404;
				return {
					status: 404,
					success: false,
					message: "Page not found",
					data: null,
				};
			case "INTERNAL_SERVER_ERROR":
				set.status = 500;
				ctxLog?.error({ code, err: error }, "internal server error");
				return {
					status: 500,
					success: false,
					message: "Internal Server Error",
					data: null,
				};
			case "UNKNOWN":
				set.status = 500;
				ctxLog?.error({ code, err: error }, "unknown error");
				return {
					status: 500,
					success: false,
					message: "An unknown error occurred",
					data: null,
				};
			case "VALIDATION":
				set.status = 422;
				return {
					status: 422,
					success: false,
					message: "An unknown error occurred",
					data: null,
				};
			default:
				ctxLog?.error({ code, err: error }, "error occurred");

				return error;
		}
	})
	.listen(AppConfig.APP_PORT);

export default app.fetch;

log.info({}, `application running on port ${AppConfig.APP_PORT}`);
