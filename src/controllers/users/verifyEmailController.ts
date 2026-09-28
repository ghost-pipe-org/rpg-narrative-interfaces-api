import { InvalidTokenError } from "@/services/errors/invalidTokenError";
import { makeVerifyEmailService } from "@/services/factories/makeVerifyEmailService";
import type { Request, Response } from "express";
import { z } from "zod";

const schema = z
	.object({
		token: z.string().min(1),
	})
	.strict();

export async function verifyEmailController(req: Request, res: Response) {
	const parsed = schema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({ errors: parsed.error.errors });
	}

	try {
		const service = makeVerifyEmailService();
		await service.execute(parsed.data);
		return res.status(200).json({ message: "E-mail verificado com sucesso" });
	} catch (error) {
		if (error instanceof InvalidTokenError) {
			return res.status(400).json({ message: error.message });
		}
		console.error(error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
