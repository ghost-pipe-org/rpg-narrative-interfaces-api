import { validationErrorBody } from "@/lib/validationError";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const emitWorkshopSchema = z
	.object({
		title: z.string().min(1, { message: "Título é obrigatório." }),
		description: z
			.string()
			.min(1, { message: "Descrição (ementa) é obrigatória." }),
		requirements: z.string().optional(),
		location: z.string().optional(),
		possibleDates: z
			.array(z.string().datetime())
			.min(1, { message: "Informe ao menos uma data possível." }),
		period: z.enum(["MANHA", "TARDE", "NOITE"], {
			message: "Período deve ser MANHA, TARDE ou NOITE.",
		}),
		minPlayers: z
			.number()
			.int()
			.min(1, { message: "Mínimo de assistentes deve ser pelo menos 1." }),
		maxPlayers: z
			.number()
			.int()
			.min(1, { message: "Máximo de assistentes deve ser pelo menos 1." }),
		facilitatorIds: z.array(z.string().uuid()).optional(),
	})
	.strict();

export const validateEmitWorkshop = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = emitWorkshopSchema.safeParse(req.body);
	if (!result.success) {
		return res.status(400).json(validationErrorBody(result.error));
	}
	next();
};
