export class UserRegistrationRequiredError extends Error {
	constructor() {
		super("User not found. Please register.");
		this.name = "UserRegistrationRequiredError";
	}
}
