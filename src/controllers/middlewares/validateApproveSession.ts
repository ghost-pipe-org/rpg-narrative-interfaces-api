import { validationErrorBody } from "@/lib/validationError";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const approveSessionSchema = z
	.object({
		approvedDate: z.string().datetime({
			message: "A data de aprovação deve ser uma data/hora ISO válida",
		}),
		location: z.string().min(1, { message: "Local é obrigatório" }),
	})
	.strict();

export const validateApproveSession = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = approveSessionSchema.safeParse(req.body);
	if (!result.success) {
		return res.status(400).json(validationErrorBody(result.error));
	}
	next();
};
