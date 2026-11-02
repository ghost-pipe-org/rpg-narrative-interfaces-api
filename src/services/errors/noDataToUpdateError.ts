export class NoDataToUpdateError extends Error {
	constructor() {
		super("Nenhum dado válido fornecido para atualização.");
		this.name = "NoDataToUpdateError";
	}
}
