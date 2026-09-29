export class UnauthorizedBlogActionError extends Error {
	constructor() {
		super("Unauthorized blog action.");
		this.name = "UnauthorizedBlogActionError";
	}
}
