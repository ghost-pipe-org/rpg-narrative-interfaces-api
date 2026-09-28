import { NotFoundError } from "@/services/errors/notFoundError";
import { SessionAlreadyRejectedError } from "@/services/errors/sessionAlreadyRejectedError";
import { makeRejectSessionService } from "@/services/factories/makeRejectSessionService";
import type { Request, Response } from "express";

export async function rejectSessionController(req: Request, res: Response) {
	const { sessionId } = req.params;
	const userId = (req.user as { id: string }).id;
	try {
		const rejectSessionService = makeRejectSessionService();

		await rejectSessionService.execute({
			sessionId,
			userId,
		});

		return res.status(200).json({ message: "Sessão rejeitada com sucesso" });
	} catch (error) {
		if (error instanceof NotFoundError) {
			return res.status(404).json({ message: error.message });
		}
		if (error instanceof SessionAlreadyRejectedError) {
			return res.status(400).json({ message: error.message });
		}
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
