import { t, TSchema } from "elysia";

// ============================================
// RESPONSE TYPE DEFINITIONS
// ============================================

export const SuccessResponseSchema = <T extends TSchema>(dataSchema: T) =>
	t.Object({
		status: t.Number(),
		success: t.Literal(true),
		message: t.String(),
		data: dataSchema,
	});

export const ErrorResponseSchema = t.Object({
	status: t.Number(),
	success: t.Literal(false),
	message: t.String(),
	data: t.Null(),
});

export const BadRequestResponseSchema = t.Object({
	status: t.Literal(400),
	success: t.Literal(false),
	message: t.String(),
	errors: t.Array(
		t.Object({
			field: t.String(),
			message: t.String(),
		}),
	),
});

export const ValidationErrorResponseSchema = t.Object({
	status: t.Number(),
	success: t.Literal(false),
	message: t.String(),
	errors: t.Array(
		t.Object({
			field: t.String(),
			message: t.String(),
		}),
	),
});

export const PaginatedResponseSchema = <T extends TSchema>(itemSchema: T) =>
	t.Object({
		status: t.Number(),
		success: t.Literal(true),
		message: t.String(),
		data: t.Object({
			data: t.Array(itemSchema),
			meta: t.Object({
				page: t.Number(),
				limit: t.Number(),
				totalCount: t.Number(),
			}),
		}),
	});

// ============================================
// RESPONSE TYPES
// ============================================

export type SuccessResponse<T> = {
	status: number;
	success: true;
	message: string;
	data: T;
};

export type ErrorResponse = {
	status: number;
	success: false;
	message: string;
	data: null;
};

export type ValidationErrorResponse = {
	status: number;
	success: false;
	message: string;
	errors: Array<{
		field: string;
		message: string;
	}>;
};

export type PaginatedResponse<T> = {
	status: number;
	success: true;
	message: string;
	data: {
		data: T[];
		meta: {
			page: number;
			limit: number;
			totalCount: number;
		};
	};
};

// ============================================
// RESPONSE TOOLKIT
// ============================================

export class ResponseToolkit {
	/**
	 * Create a success response
	 * @param data - The response data
	 * @param message - Success message (default: "Success")
	 * @param status - HTTP status code (default: 200)
	 */
	static success<T>(
		data: T,
		message: string = "Success",
		status: number = 200,
	): SuccessResponse<T> {
		return {
			status,
			success: true,
			message,
			data,
		};
	}

	/**
	 * Create a paginated success response
	 * @param data - Array of items
	 * @param meta - Pagination metadata
	 * @param message - Success message
	 * @param status - HTTP status code (default: 200)
	 */
	static paginated<T>(
		data: T[],
		meta: {
			page: number;
			limit: number;
			totalCount: number;
		},
		message: string = "Data retrieved successfully",
		status: number = 200,
	): PaginatedResponse<T> {
		return {
			status,
			success: true,
			message,
			data: {
				data,
				meta,
			},
		};
	}

	/**
	 * Create an error response
	 * @param message - Error message
	 * @param status - HTTP status code (default: 400)
	 */
	static error(message: string, status: number = 400): ErrorResponse {
		return {
			status,
			success: false,
			message,
			data: null,
		};
	}

	/**
	 * Create a validation error response
	 * @param errors - Array of field-specific errors
	 * @param message - Overall error message (default: "Validation failed")
	 * @param status - HTTP status code (default: 422)
	 */
	static validationError(
		errors: Array<{ field: string; message: string }>,
		message: string = "Validation failed",
		status: number = 422,
	): ValidationErrorResponse {
		return {
			status,
			success: false,
			message,
			errors,
		};
	}

	/**
	 * Create a not found response
	 * @param message - Error message (default: "Resource not found")
	 */
	static notFound(message: string = "Resource not found"): ErrorResponse {
		return this.error(message, 404);
	}

	/**
	 * Create an unauthorized response
	 * @param message - Error message (default: "Unauthorized")
	 */
	static unauthorized(message: string = "Unauthorized"): ErrorResponse {
		return this.error(message, 401);
	}

	/**
	 * Create a forbidden response
	 * @param message - Error message (default: "Forbidden")
	 */
	static forbidden(message: string = "Forbidden"): ErrorResponse {
		return this.error(message, 403);
	}

	/**
	 * Create a conflict response
	 * @param message - Error message
	 */
	static conflict(message: string): ErrorResponse {
		return this.error(message, 409);
	}

	/**
	 * Create a too many requests response
	 * @param message - Error message (default: "Too many requests")
	 */
	static tooManyRequests(message: string = "Too many requests"): ErrorResponse {
		return this.error(message, 429);
	}

	/**
	 * Create an internal server error response
	 * @param message - Error message (default: "Internal server error")
	 */
	static internalError(
		message: string = "Internal server error",
	): ErrorResponse {
		return this.error(message, 500);
	}

	/**
	 * Create a created response (for POST requests)
	 * @param data - The created resource data
	 * @param message - Success message (default: "Resource created successfully")
	 */
	static created<T>(
		data: T,
		message: string = "Resource created successfully",
	): SuccessResponse<T> {
		return this.success(data, message, 201);
	}

	/**
	 * Create a no content response (for DELETE requests)
	 */
	static noContent(): { status: 204 } {
		return { status: 204 };
	}

	/**
	 * Create an accepted response (for async operations)
	 * @param data - Optional data about the accepted operation
	 * @param message - Success message (default: "Request accepted for processing")
	 */
	static accepted<T>(
		data: T,
		message: string = "Request accepted for processing",
	): SuccessResponse<T> {
		return this.success(data, message, 202);
	}
}

// ============================================
// COMMON RESPONSE SCHEMAS FOR ELYSIA ROUTES
// ============================================

export const CommonResponseSchemas = {
	// Success responses
	200: SuccessResponseSchema(t.Any()),
	201: SuccessResponseSchema(t.Any()),
	202: SuccessResponseSchema(t.Any()),
	204: t.Object({}),

	// Error responses
	400: BadRequestResponseSchema,
	401: t.Object({
		status: t.Literal(401),
		success: t.Literal(false),
		message: t.String(),
		data: t.Null(),
	}),
	403: t.Object({
		status: t.Literal(403),
		success: t.Literal(false),
		message: t.String(),
		data: t.Null(),
	}),
	404: t.Object({
		status: t.Literal(404),
		success: t.Literal(false),
		message: t.String(),
		data: t.Null(),
	}),
	409: t.Object({
		status: t.Literal(409),
		success: t.Literal(false),
		message: t.String(),
		data: t.Null(),
	}),
	422: ValidationErrorResponseSchema,
	429: t.Object({
		status: t.Literal(429),
		success: t.Literal(false),
		message: t.String(),
		data: t.Null(),
	}),
	500: t.Object({
		status: t.Literal(500),
		success: t.Literal(false),
		message: t.String(),
		data: t.Null(),
	}),
	503: t.Object({
		status: t.Literal(503),
		success: t.Literal(false),
		message: t.String(),
		data: t.Null(),
	}),
};

// Helper to create response schema with specific data type
export const createResponseSchema = <T extends TSchema>(dataSchema: T) => ({
	200: SuccessResponseSchema(dataSchema),
	400: ErrorResponseSchema,
	401: CommonResponseSchemas[401],
	404: CommonResponseSchemas[404],
	422: ValidationErrorResponseSchema,
	500: CommonResponseSchemas[500],
});

// Helper to create paginated response schema
export const createPaginatedResponseSchema = <T extends TSchema>(
	itemSchema: T,
) => ({
	200: PaginatedResponseSchema(itemSchema),
	400: ErrorResponseSchema,
	401: CommonResponseSchemas[401],
	422: ValidationErrorResponseSchema,
	500: CommonResponseSchemas[500],
});
