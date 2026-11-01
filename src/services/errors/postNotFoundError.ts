export class PostNotFoundError extends Error {
	constructor() {
		super("Post not found.");
		this.name = "PostNotFoundError";
	}
}
