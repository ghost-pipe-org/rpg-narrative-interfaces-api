export class SessionAlreadyRejectedError extends Error {
	constructor() {
		super("Sessão já rejeitada.");
		this.name = "SessionAlreadyRejectedError";
	}
}
