import { AlreadyEnrolledError } from "@/services/errors/alreadyEnrolledError";
import { EnrollmentClosedError } from "@/services/errors/enrollmentClosedError";
import { InvalidSessionError } from "@/services/errors/invalidSessionError";
import { InvalidUserError } from "@/services/errors/invalidUserError";
import { SessionConflictError } from "@/services/errors/sessionConflictError";
import { SessionFullError } from "@/services/errors/sessionFullError";
import { makeSubscribeUserToSessionService } from "@/services/factories/makesubscribeUserToSessionService";
import type { Request, Response } from "express";

export async function subscribeUserToSessionController(
	req: Request,
	res: Response,
) {
	const { sessionId } = req.params;
	const userId = (req.user as { id: string }).id;

	try {
		const subscribeUserToSessionService = makeSubscribeUserToSessionService();

		await subscribeUserToSessionService.execute({
			sessionId,
			userId,
		});

		return res
			.status(200)
			.json({ message: "Usuário inscrito na sessão com sucesso" });
	} catch (error) {
		if (error instanceof InvalidSessionError) {
			return res.status(404).json({ message: "Sessão não encontrada" });
		}
		if (error instanceof InvalidUserError) {
			return res.status(404).json({ message: "Usuário não encontrado" });
		}
		if (error instanceof EnrollmentClosedError) {
			return res.status(403).json({ message: error.message });
		}
		if (error instanceof SessionConflictError) {
			return res.status(409).json({ message: error.message });
		}
		if (error instanceof AlreadyEnrolledError) {
			return res
				.status(409)
				.json({ message: "Usuário já está inscrito nesta sessão" });
		}
		if (error instanceof SessionFullError) {
			return res
				.status(409)
				.json({ message: "A sessão atingiu a capacidade máxima" });
		}

		console.error("Error subscribing user to session:", error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
