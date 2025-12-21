export type ApiResponse<T> = {
	status: number;
	success: boolean;
	message: string;
	data: T | null;
};

export class ResponseToolkit {
	static success<T>(
		data: T | null,
		message: string = "Success",
		statusCode: number,
	): ApiResponse<T> {
		return {
			status: statusCode,
			success: true,
			message,
			data,
		};
	}

	static error(message: string, statusCode: number = 400): ApiResponse<null> {
		return {
			status: statusCode,
			success: false,
			message,
			data: null,
		};
	}

	static notFound(message: string = "Resource not found"): ApiResponse<null> {
		return this.error(message, 404);
	}

	static unauthorized(message: string = "Unauthorized"): ApiResponse<null> {
		return this.error(message, 401);
	}

	static response<T>(
		success: boolean,
		data: T | null,
		message: string = "Success",
		statusCode: number = 200,
	): ApiResponse<T> {
		return {
			status: statusCode,
			success,
			message,
			data,
		};
	}

	static validationError(
		errors: { [key: string]: string }[],
		message: string = "Validation failed",
		statusCode: number = 422,
	): ApiResponse<{
		validationErrors: { [key: string]: string }[];
	}> {
		return {
			status: statusCode,
			success: false,
			message,
			data: { validationErrors: errors },
		};
	}
}
