export class SessionAlreadyApprovedError extends Error {
	constructor() {
		super("Sessão já aprovada.");
		this.name = "SessionAlreadyApprovedError";
	}
}
