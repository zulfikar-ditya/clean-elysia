export class NotFoundError extends Error {
	code: number;

	/**
	 * Represents an error when a user is not authorized to access a resource.
	 * @param {string} message - The error message.
	 */
	constructor(message: string = "Resource not found") {
		super(message);
		this.name = "UnprocessableEntityError";
		this.code = 422;
	}
}
