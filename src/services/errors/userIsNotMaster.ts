export class userIsNotMaster extends Error {
	constructor() {
		super("O usuário não é o mestre desta sessão.");
		this.name = "userIsNotMaster";
	}
}
