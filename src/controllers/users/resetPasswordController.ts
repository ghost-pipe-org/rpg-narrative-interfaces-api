import { InvalidTokenError } from "@/services/errors/invalidTokenError";
import { makeResetPasswordService } from "@/services/factories/makeResetPasswordService";
import type { Request, Response } from "express";
import { z } from "zod";

const schema = z
	.object({
		token: z.string().min(1),
		password: z
			.string()
			.min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
			.regex(/[A-Z]/, {
				message: "A senha deve conter pelo menos uma letra maiúscula",
			})
			.regex(/[0-9]/, {
				message: "A senha deve conter pelo menos um número",
			}),
	})
	.strict();

export async function resetPasswordController(req: Request, res: Response) {
	const parsed = schema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({ errors: parsed.error.errors });
	}

	try {
		const service = makeResetPasswordService();
		await service.execute(parsed.data);
		return res.status(200).json({ message: "Senha redefinida com sucesso" });
	} catch (error) {
		if (error instanceof InvalidTokenError) {
			return res.status(400).json({ message: error.message });
		}
		console.error(error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
