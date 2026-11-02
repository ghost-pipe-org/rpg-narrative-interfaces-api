import { validationErrorBody } from "@/lib/validationError";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const cancelApprovedSessionSchema = z.object({
	cancelEvent: z.string().min(10, {
		message: "O motivo do cancelamento deve ter no mínimo 10 caracteres.",
	}),
});

export const validateCancelApprovedSession = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = cancelApprovedSessionSchema.safeParse(req.body);
	if (!result.success) {
		return res.status(400).json(validationErrorBody(result.error));
	}
	next();
};
