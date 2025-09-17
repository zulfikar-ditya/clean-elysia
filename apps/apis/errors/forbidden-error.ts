export class ForbiddenError extends Error {
	code: number;

	/**
	 * Represents an error when a user is not authorized to access a resource.
	 * @param {string} message - The error message.
	 */
	constructor(message = "Forbidden") {
		super(message);
		this.name = "Forbidden";
		this.code = 403;
	}
}
