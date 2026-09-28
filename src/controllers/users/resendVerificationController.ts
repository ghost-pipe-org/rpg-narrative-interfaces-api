import { makeResendVerificationService } from "@/services/factories/makeResendVerificationService";
import { validationErrorBody } from "@/lib/validationError";
import type { Request, Response } from "express";
import { z } from "zod";

const schema = z
	.object({
		email: z.string().email(),
	})
	.strict();

export async function resendVerificationController(req: Request, res: Response) {
	const parsed = schema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json(validationErrorBody(parsed.error));
	}

	try {
		const service = makeResendVerificationService();
		await service.execute(parsed.data);
		return res.status(200).json({
			message:
				"Se existir uma conta com este e-mail ainda não verificada, um e-mail de verificação foi enviado.",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
