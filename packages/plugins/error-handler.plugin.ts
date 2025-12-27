import { Elysia } from "elysia";

import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	RateLimitError,
	UnauthorizedError,
	UnprocessableEntityError,
} from "../errors";
import { LoggerPlugin } from "./logger.plugin";

// Type definitions for Elysia validation errors
interface ValidationError {
	path?: string;
	message?: string;
}

interface ValidationErrorDetails {
	validator?: {
		errors?: ValidationError[];
	};
}

export const ErrorHandlerPlugin = new Elysia({
	name: "error-handler",
})
	.use(LoggerPlugin)
	.onError(({ code, error, set, log }) => {
		if (error instanceof BadRequestError) {
			set.status = 400;
			log?.warn({ error: error.message, errors: error.error }, "Bad request");
			return {
				status: 400,
				success: false,
				message: error.message || "Bad Request",
				errors: error.error || [],
			};
		}

		if (error instanceof UnprocessableEntityError) {
			set.status = 422;
			log?.warn(
				{ error: error.message, errors: error.error },
				"Validation error",
			);
			return {
				status: 422,
				success: false,
				message: error.message || "Unprocessable Entity",
				errors: error.error || [],
			};
		}

		if (error instanceof NotFoundError) {
			set.status = 404;
			log?.warn({ error: error.message }, "Not found");
			return {
				status: 404,
				success: false,
				message: error.message || "Not Found",
				data: null,
			};
		}

		if (error instanceof UnauthorizedError) {
			set.status = 401;
			log?.warn({ error: error.message }, "Unauthorized");
			return {
				status: 401,
				success: false,
				message: error.message || "Unauthorized",
				data: null,
			};
		}

		if (error instanceof ForbiddenError) {
			set.status = 403;
			log?.warn({ error: error.message }, "Forbidden");
			return {
				status: 403,
				success: false,
				message: error.message || "Forbidden",
				data: null,
			};
		}

		if (error instanceof RateLimitError) {
			set.status = 429;
			log?.warn({ error: error.message }, "Rate limited");
			return {
				status: 429,
				success: false,
				message: error.message || "Too Many Requests",
				data: null,
			};
		}

		if (code === "VALIDATION") {
			set.status = 422;
			log?.warn({ error }, "Request validation failed");

			const validationError = error as ValidationErrorDetails;
			const errors =
				validationError?.validator?.errors?.map((err: ValidationError) => ({
					field: err.path?.replace("/", "") || "unknown",
					message: err.message || "Validation failed",
				})) ?? [];

			return {
				status: 422,
				success: false,
				message: "Request validation failed",
				errors:
					errors.length > 0
						? errors
						: [{ field: "general", message: "Invalid request data" }],
			};
		}

		if (code === "NOT_FOUND") {
			set.status = 404;
			return {
				status: 404,
				success: false,
				message: "Route not found",
				data: null,
			};
		}

		if (code === "PARSE") {
			set.status = 400;
			return {
				status: 400,
				success: false,
				message: "Invalid request format",
				errors: [{ field: "body", message: "Failed to parse request body" }],
			};
		}

		set.status = 500;
		log?.error({ error }, "Unhandled error");

		return {
			status: 500,
			success: false,
			message: "Internal Server Error",
			data: null,
		};
	});
