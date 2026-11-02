export class AlreadyEnrolledError extends Error {
	constructor() {
		super("Usuário já está inscrito nesta sessão.");
		this.name = "AlreadyEnrolledError";
	}
}
