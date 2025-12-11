export class RateLimitError extends Error {
	constructor(public message: string = "rate-limited") {
		super(message);
	}
}
