import { validationErrorBody } from "@/lib/validationError";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const updateProfileSchema = z
	.object({
		name: z
			.string()
			.min(2, "Nome deve ter pelo menos 2 caracteres")
			.max(100, "Nome deve ter no máximo 100 caracteres")
			.regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, {
				message: "Nome deve conter apenas letras e espaços",
			})
			.transform((val) => val.trim())
			.optional(),

		phoneNumber: z
			.string()
			.regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
				message: "Telefone deve estar no formato (11) 99999-9999",
			})
			.or(z.literal(""))
			.optional(),

		email: z.string().email({ message: "E-mail inválido" }).max(100).optional(),
		enrollment: z
			.any()
			.optional()
			.transform(() => undefined),
		role: z
			.any()
			.optional()
			.transform(() => undefined),
		id: z
			.any()
			.optional()
			.transform(() => undefined),
	})
	.strict()
	.refine(
		(data) => {
			return data.name !== undefined || data.phoneNumber !== undefined;
		},
		{
			message: "Pelo menos um campo deve ser fornecido para atualização",
		},
	);

export const validateUpdateProfile = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = updateProfileSchema.safeParse(req.body);

	if (!result.success) {
		return res.status(400).json(validationErrorBody(result.error));
	}
	req.body = result.data;
	next();
};
