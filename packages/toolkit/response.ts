import { Context } from "elysia";

export class ResponseToolkit {
	static success<T>(
		ctx: Context,
		data: T | null,
		message: string = "Success",
		statusCode: number,
	) {
		ctx.status(statusCode);

		return {
			status: statusCode,
			success: true,
			message,
			data,
		};
	}

	static error(message: string, statusCode: number = 400) {
		return {
			status: statusCode,
			success: false,
			message,
			statusCode,
		};
	}

	static notFound(message: string = "Resource not found") {
		return this.error(message, 404);
	}

	static unauthorized(message: string = "Unauthorized") {
		return this.error(message, 401);
	}

	static response<T>(
		ctx: Context,
		success: boolean,
		data: T | null,
		message: string = "Success",
		statusCode: number = 200,
	) {
		ctx.status(statusCode);

		return {
			status: statusCode,
			success,
			message,
			data,
		};
	}

	static validationError(
		ctx: Context,
		errors: { [key: string]: string }[],
		message: string = "Validation failed",
		statusCode: number = 422,
	) {
		ctx.set.status = statusCode;

		return {
			status: statusCode,
			success: false,
			message,
			errors,
		};
	}
}
