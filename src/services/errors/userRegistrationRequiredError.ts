export class UserRegistrationRequiredError extends Error {
	constructor() {
		super("Conta não cadastrada.");
		this.name = "UserRegistrationRequiredError";
	}
}
