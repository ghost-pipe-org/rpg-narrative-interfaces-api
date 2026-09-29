export class UserAlreadyExistsError extends Error {
	constructor() {
		super("Usuário já existe.");
		this.name = "UserAlreadyExistsError";
	}
}
