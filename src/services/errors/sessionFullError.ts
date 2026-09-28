export class SessionFullError extends Error {
	constructor() {
		super("A sessão atingiu a capacidade máxima.");
		this.name = "SessionFullError";
	}
}
