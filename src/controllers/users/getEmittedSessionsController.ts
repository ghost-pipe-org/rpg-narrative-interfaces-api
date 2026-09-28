import { makeGetMasterEmittedSessionsService } from "@/services/factories/makeGetMasterEmittedSessionsService";
import type { Request, Response } from "express";

export async function getEmittedSessionsController(
	req: Request,
	res: Response,
) {
	const masterEmittedSessionsService = makeGetMasterEmittedSessionsService();

	try {
		const masterId = (req.user as { id: string }).id; // Garantido pelo middleware
		const { emittedSessions } = await masterEmittedSessionsService.execute({
			masterId,
		});

		return res.status(200).json({ data: emittedSessions });
	} catch (error) {
		console.error("Error fetching emitted sessions:", error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
