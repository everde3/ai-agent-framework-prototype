export class UserFacingError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
	}

	getUserFacingError(): string {
		return this.message;
	}

	getStatusCode(): number {
		return this.statusCode;
	}
}
