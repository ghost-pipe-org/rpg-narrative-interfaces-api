import { validationErrorBody } from "@/lib/validationError";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const emitSessionSquema = z
	.object({
		title: z.string().min(1, { message: "Título é obrigatório" }),
		description: z.string().min(1, { message: "Descrição é obrigatória" }),
		requirements: z.string().optional(),
		system: z.string().min(1, { message: "Sistema é obrigatório" }),
		possibleDates: z
			.array(z.string().datetime())
			.min(1, { message: "Informe ao menos uma data" }),
		period: z.enum(["MANHA", "TARDE", "NOITE"], {
			message: "Período deve ser MANHA, TARDE ou NOITE",
		}),
		minPlayers: z
			.number()
			.int()
			.min(1, { message: "Mínimo de jogadores deve ser pelo menos 1" }),
		maxPlayers: z
			.number()
			.int()
			.min(1, { message: "Máximo de jogadores deve ser pelo menos 1" }),
	})
	.strict();

export const validateEmitSession = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = emitSessionSquema.safeParse(req.body);
	if (!result.success) {
		return res.status(400).json(validationErrorBody(result.error));
	}
	next();
};
