import { validationErrorBody } from "@/lib/validationError";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const updatePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "A senha atual é obrigatória"),
		newPassword: z
			.string()
			.min(6, "Senha deve ter pelo menos 6 caracteres")
			.max(50, "Senha não pode ter mais de 50 caracteres")
			.regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
			.regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
			.regex(/[0-9]/, "Senha deve conter pelo menos um número")
			.regex(
				/[^A-Za-z0-9]/,
				"Senha deve conter pelo menos um caractere especial",
			),
	})
	.strict();

export const validateUpdatePassword = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = updatePasswordSchema.safeParse(req.body);

	if (!result.success) {
		return res.status(400).json(
			validationErrorBody(result.error, "Dados de senha inválidos"),
		);
	}
	req.body = result.data;
	next();
};
