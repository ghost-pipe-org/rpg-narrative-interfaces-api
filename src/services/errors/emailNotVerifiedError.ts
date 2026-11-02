export class EmailNotVerifiedError extends Error {
	constructor() {
		super(
			"É necessário verificar o e-mail para ativar a conta. Enviamos um novo link de verificação.",
		);
		this.name = "EmailNotVerifiedError";
	}
}
