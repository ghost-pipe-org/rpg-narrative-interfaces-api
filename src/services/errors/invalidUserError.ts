export class InvalidUserError extends Error {
	constructor() {
		super("Usuário inválido.");
		this.name = "InvalidUserError";
	}
}
