export class NotEnrolledError extends Error {
	constructor() {
		super("Usuário não está inscrito nesta sessão.");
		this.name = "NotEnrolledError";
	}
}
