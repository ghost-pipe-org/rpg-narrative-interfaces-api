export class UserRegistrationRequiredError extends Error {
	constructor() {
		super(
			"Conta Google não vinculada, crie uma conta para poder fazer login",
		);
		this.name = "UserRegistrationRequiredError";
	}
}
