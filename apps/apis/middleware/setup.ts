// apps/apis/middleware/setup.ts
import { AppConfig, CORSConfig } from "@config";
import cors from "@elysiajs/cors";
import { LoggerPlugin } from "@packages";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";
import { rateLimit } from "elysia-rate-limit";
import openapi from "@elysiajs/openapi";

import { RateLimitError } from "../errors/to-many-request-error";
import {
	BadRequestError,
	ForbiddenError,
	UnauthorizedError,
	UnprocessableEntityError,
	NotFoundError,
} from "../errors";

// Separate concerns into dedicated middleware
export const requestIdMiddleware = new Elysia({ name: "request-id" }).derive(
	() => ({
		requestId:
			globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
		startedAt: Date.now(),
	}),
);

export const docsMiddleware = new Elysia({ name: "docs" }).use(
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
);

export const securityMiddleware = new Elysia({ name: "security" })
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
	);

// Centralized error handling with consistent response format
export const errorHandlerMiddleware = new Elysia({
	name: "error-handler",
}).onError(({ code, error, set, log }) => {
	// Handle BadRequestError (400)
	if (error instanceof BadRequestError) {
		set.status = 400;

		if (log) {
			log.warn(
				{
					error: error.message,
					errors: error.error,
				},
				"Bad request error",
			);
		}

		return {
			status: 400,
			success: false,
			message: error.message || "Bad Request",
			errors: error.error || [],
		};
	}

	// Handle UnprocessableEntityError (422)
	if (error instanceof UnprocessableEntityError) {
		set.status = 422;

		if (log) {
			log.warn(
				{
					error: error.message,
					errors: error.error,
				},
				"Validation error",
			);
		}

		return {
			status: 422,
			success: false,
			message: error.message || "Unprocessable Entity",
			errors: error.error || [],
		};
	}

	// Handle NotFoundError (404)
	if (error instanceof NotFoundError) {
		set.status = 404;

		if (log) {
			log.warn({ error: error.message }, "Not found error");
		}

		return {
			status: 404,
			success: false,
			message: error.message || "Not Found",
			data: null,
		};
	}

	// Handle UnauthorizedError (401)
	if (error instanceof UnauthorizedError) {
		set.status = 401;

		if (log) {
			log.warn({ error: error.message }, "Unauthorized error");
		}

		return {
			status: 401,
			success: false,
			message: error.message || "Unauthorized",
			data: null,
		};
	}

	// Handle ForbiddenError (403)
	if (error instanceof ForbiddenError) {
		set.status = 403;

		if (log) {
			log.warn({ error: error.message }, "Forbidden error");
		}

		return {
			status: 403,
			success: false,
			message: error.message || "Forbidden",
			data: null,
		};
	}

	// Handle RateLimitError (429)
	if (error instanceof RateLimitError) {
		set.status = 429;

		if (log) {
			log.warn({ error: error.message }, "Rate limit exceeded");
		}

		return {
			status: 429,
			success: false,
			message: error.message || "Too Many Requests",
			data: null,
		};
	}

	// Handle Elysia validation errors
	if (code === "VALIDATION") {
		set.status = 422;

		if (log) {
			log.warn({ error }, "Request validation failed");
		}

		// Parse Elysia validation errors
		const validationErrors: Array<{ field: string; message: string }> = [];

		if (error && typeof error === "object" && "validator" in error) {
			const validator = error as any;
			if (validator.errors && Array.isArray(validator.errors)) {
				validator.errors.forEach((err: any) => {
					validationErrors.push({
						field: err.path?.replace("/", "") || "unknown",
						message: err.message || "Validation failed",
					});
				});
			}
		}

		return {
			status: 422,
			success: false,
			message: "Request validation failed",
			errors:
				validationErrors.length > 0
					? validationErrors
					: [{ field: "general", message: "Invalid request data" }],
		};
	}

	// Handle Elysia NOT_FOUND
	if (code === "NOT_FOUND") {
		set.status = 404;

		if (log) {
			log.warn("Route not found");
		}

		return {
			status: 404,
			success: false,
			message: "Route not found",
			data: null,
		};
	}

	// Handle PARSE errors (invalid JSON, etc.)
	if (code === "PARSE") {
		set.status = 400;

		if (log) {
			log.warn({ error }, "Failed to parse request");
		}

		return {
			status: 400,
			success: false,
			message: "Invalid request format",
			errors: [{ field: "body", message: "Failed to parse request body" }],
		};
	}

	// Handle INTERNAL_SERVER_ERROR
	if (code === "INTERNAL_SERVER_ERROR") {
		set.status = 500;

		if (log) {
			log.error({ error, stack: error?.stack }, "Internal server error");
		}

		// Don't expose internal error details in production
		const message =
			process.env.APP_ENV === "production"
				? "Internal Server Error"
				: error?.message || "Internal Server Error";

		return {
			status: 500,
			success: false,
			message,
			data: null,
		};
	}

	// Handle UNKNOWN errors
	if (code === "UNKNOWN") {
		set.status = 500;

		if (log) {
			log.error({ error, stack: error?.stack }, "Unknown error occurred");
		}

		return {
			status: 500,
			success: false,
			message: "An unexpected error occurred",
			data: null,
		};
	}

	// Catch-all for any other errors
	set.status = 500;

	if (log) {
		log.error({ code, error }, "Unhandled error");
	}

	return {
		status: 500,
		success: false,
		message: "An error occurred",
		data: null,
	};
});

export const setupMiddlewares = new Elysia({ name: "middlewares" })
	.use(requestIdMiddleware)
	.use(docsMiddleware)
	.use(LoggerPlugin)
	.use(securityMiddleware)
	.use(errorHandlerMiddleware);
