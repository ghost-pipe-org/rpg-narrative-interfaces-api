export class EmailNotVerifiedError extends Error {
	constructor() {
		super("Email not verified.");
		this.name = "EmailNotVerifiedError";
	}
}
