import { validationErrorBody } from "@/lib/validationError";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const authenticateSchema = z.union([
	z
		.object({
			email: z.string().email({ message: "Endereço de e-mail inválido" }),
			password: z.string(),
		})
		.strict(),
	z
		.object({
			googleIdToken: z.string().min(1, { message: "googleIdToken é obrigatório" }),
		})
		.strict(),
]);

export const validateAuthenticate = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = authenticateSchema.safeParse(req.body);
	if (!result.success) {
		return res.status(400).json(validationErrorBody(result.error));
	}
	next();
};
