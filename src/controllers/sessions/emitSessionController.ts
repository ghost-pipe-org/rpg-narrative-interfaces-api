import { PendingSessionExistsError } from "@/services/errors/PendingSessionExistsError";
import { AlreadyEnrolledError } from "@/services/errors/alreadyEnrolledError";
import { makeEmitSessionService } from "@/services/factories/makeEmitSessionService";
import type { Request, Response } from "express";

export async function emitSessionController(req: Request, res: Response) {
	const masterId = (req.user as { id: string }).id;

	const {
		title,
		description,
		requirements,
		system,
		possibleDates,
		period,
		minPlayers,
		maxPlayers,
	} = req.body;

	try {
		const emitSessionService = makeEmitSessionService();
		const { session } = await emitSessionService.execute({
			title,
			description,
			requirements,
			system,
			possibleDates: possibleDates.map((date: string) => new Date(date)),
			period,
			minPlayers,
			maxPlayers,
			masterId,
		});

		return res
			.status(201)
			.json({ message: "Sessão emitida com sucesso", data: session });
	} catch (error) {
		if (error instanceof PendingSessionExistsError) {
			return res.status(409).json({ message: error.message });
		}

		console.error("Error emitting session:", error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
