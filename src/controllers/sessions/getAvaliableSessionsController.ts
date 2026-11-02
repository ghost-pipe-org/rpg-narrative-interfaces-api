import { makeAvaliableSessionsService } from "@/services/factories/makeAvaliableSessionsService";
import type { Request, Response } from "express";

export async function getAvaliableSessionsController(
	req: Request,
	res: Response,
) {
	const avaliableSessionsService = makeAvaliableSessionsService();

	try {
		const { sessions } = await avaliableSessionsService.execute("MESA");
		return res.status(200).json({ data: sessions });
	} catch (error) {
		console.error("Error fetching available sessions:", error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
