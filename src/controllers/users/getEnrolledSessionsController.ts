import { makeGetUserEnrolledSessionsService } from "@/services/factories/makeGetUserEnrolledSessionsService";
import type { Request, Response } from "express";

export async function getEnrolledSessionsController(
	req: Request,
	res: Response,
) {
	const getUserEnrolledSessionsService = makeGetUserEnrolledSessionsService();

	try {
		const userId = (req.user as { id: string }).id;
		const { enrolledSessions } = await getUserEnrolledSessionsService.execute({
			userId,
		});

		return res.status(200).json({ data: enrolledSessions });
	} catch (error) {
		console.error("Error fetching enrolled sessions:", error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
