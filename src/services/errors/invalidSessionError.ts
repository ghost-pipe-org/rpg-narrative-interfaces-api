export class InvalidSessionError extends Error {
	constructor() {
		super("Sessão inválida.");
		this.name = "InvalidSessionError";
	}
}
