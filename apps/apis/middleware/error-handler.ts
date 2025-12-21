import { ForbiddenError, UnprocessableEntityError } from "@apis/errors";
import { NotFoundError } from "@apis/errors/not-found-error";
import { UnauthorizedError } from "@apis/errors/unauthorized-error";
import { log } from "@packages/*";
import { RateLimitError } from "bullmq";
import Elysia from "elysia";
import { BadRequestError } from "../errors/bad-request-error";

export const errorHandler = new Elysia().onError(({ code, error, set }) => {
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
			log.error({ code, err: error }, "internal server error");
			return {
				status: 500,
				success: false,
				message: "Internal Server Error",
				data: null,
			};
		case "UNKNOWN":
			set.status = 500;
			log.error({ code, err: error }, "unknown error");
			return {
				status: 500,
				success: false,
				message: "An unknown error occurred",
				data: null,
			};
		default:
			log.error({ code, err: error }, "error occurred");
			return error;
	}
});
