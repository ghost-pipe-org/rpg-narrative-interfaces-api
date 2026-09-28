export class InvalidTokenError extends Error {
	constructor() {
		super("Token inválido ou expirado.");
		this.name = "InvalidTokenError";
	}
}
