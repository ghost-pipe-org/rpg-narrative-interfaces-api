import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const updateEmailSchema = z
	.object({
		currentPassword: z.string().min(1, "A senha atual é obrigatória"),
		newEmail: z
			.string()
			.email({ message: "Por favor, insira um e-mail válido" })
			.min(2, "Email deve ter mais de 2 caracteres")
			.max(100, "Email não pode ter mais de 100 caracteres"),
	})
	.strict();

export const validateUpdateEmail = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = updateEmailSchema.safeParse(req.body);

	if (!result.success) {
		return res.status(400).json({
			message: "Dados de e-mail inválidos",
			errors: result.error.errors,
		});
	}
	req.body = result.data;
	next();
};
