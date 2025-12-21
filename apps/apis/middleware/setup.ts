import { AppConfig, CORSConfig } from "@config";
import cors from "@elysiajs/cors";
import { LoggerPlugin } from "@packages";
import { Elysia, NotFoundError } from "elysia";
import { helmet } from "elysia-helmet";
import { rateLimit } from "elysia-rate-limit";

import { RateLimitError } from "../errors/to-many-request-error";
import {
	BadRequestError,
	ForbiddenError,
	UnauthorizedError,
	UnprocessableEntityError,
} from "../errors";
import openapi from "@elysiajs/openapi";

export const setupMiddlewares = new Elysia()
	.derive(() => ({
		requestId:
			globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
		startedAt: Date.now(),
	}))
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
	.use(LoggerPlugin)
	.use(cors(CORSConfig))
	.use(
		rateLimit({
			max: 100,
			duration: 60 * 1000,
			headers: true,
			errorResponse: new RateLimitError(),
		}),
	)
	.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					scriptSrc: ["'self'"],
					styleSrc: ["'self'", "'unsafe-inline'"],
					imgSrc: ["'self'", "data:", "https:"],
					connectSrc: ["'self'"],
					fontSrc: ["'self'"],
					objectSrc: ["'none'"],
					mediaSrc: ["'self'"],
					frameSrc: ["'none'"],
					baseUri: ["'self'"],
					formAction: ["'self'"],
				},
			},
			crossOriginEmbedderPolicy: true,
			crossOriginOpenerPolicy: true,
			crossOriginResourcePolicy: { policy: "cross-origin" },
			dnsPrefetchControl: true,
			frameguard: { action: "deny" },
			xContentTypeOptions: true,
			aot: true,
		}),
	)
	.onError(({ code, error, set, log }) => {
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

		if (error instanceof BadRequestError) {
			set.status = 400;
			const errorMessages =
				typeof error.error === "string"
					? [{ field: "general", message: error.error }]
					: error.error || [];

			return {
				status: 400,
				success: false,
				message: error.message || "Bad Request",
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

		if (error instanceof RateLimitError) {
			set.status = 429;
			return {
				status: 429,
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
				if (log) log.error({ code, err: error }, "internal server error");
				return {
					status: 500,
					success: false,
					message: "Internal Server Error",
					data: null,
				};
			case "UNKNOWN":
				set.status = 500;
				if (log) log.error({ code, err: error }, "unknown error");
				return {
					status: 500,
					success: false,
					message: "An unknown error occurred",
					data: null,
				};
			default:
				if (log) log.error({ code, err: error }, "unhandled error");
				return error;
		}
	});
