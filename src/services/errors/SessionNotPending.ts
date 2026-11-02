export class SessionNotPending extends Error {
	constructor() {
		super("A sessão não está com status PENDENTE.");
		this.name = "SessionNotPending";
	}
}
