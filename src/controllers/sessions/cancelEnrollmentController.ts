import { EnrollmentCancellationWindowError } from "@/services/errors/enrollmentCancellationWindowError";
import { InvalidSessionError } from "@/services/errors/invalidSessionError";
import { InvalidUserError } from "@/services/errors/invalidUserError";
import { NotEnrolledError } from "@/services/errors/notEnrolledError";
import { makeCancelEnrollmentService } from "@/services/factories/makeCancelEnrollmentService";
import type { Request, Response } from "express";

export async function cancelEnrollmentController(req: Request, res: Response) {
	const { sessionId } = req.params;
	const userId = (req.user as { id: string }).id;

	try {
		const cancelEnrollmentService = makeCancelEnrollmentService();

		await cancelEnrollmentService.execute({
			sessionId,
			userId,
		});

		return res
			.status(200)
			.json({ message: "Inscrição na sessão cancelada com sucesso" });
	} catch (error) {
		if (error instanceof InvalidSessionError) {
			return res.status(404).json({ message: "Sessão não encontrada" });
		}
		if (error instanceof InvalidUserError) {
			return res.status(404).json({ message: "Usuário não encontrado" });
		}
		if (error instanceof NotEnrolledError) {
			return res
				.status(404)
				.json({ message: "Usuário não está inscrito nesta sessão" });
		}
		if (error instanceof EnrollmentCancellationWindowError) {
			return res.status(403).json({ message: error.message });
		}

		console.error("Error unsubscribing user from session:", error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
