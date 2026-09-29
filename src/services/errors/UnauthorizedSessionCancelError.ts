export class UnauthorizedSessionCancelError extends Error {
	constructor() {
		super("Não autorizado. É necessário ser um mestre.");
		this.name = "UnauthorizedSessionCancelError";
	}
}
