import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const passwordSchema = z
	.string()
	.min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
	.regex(/[A-Z]/, {
		message: "A senha deve conter pelo menos uma letra maiúscula",
	})
	.regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" });

const baseFields = {
	name: z.string().min(1, { message: "Nome é obrigatório" }),
	enrollment: z
		.string()
		.regex(/^\d{9}$/)
		.or(z.literal(""))
		.optional(),
	phoneNumber: z
		.string()
		.regex(/^\d{10,11}$/, {
			message:
				"Telefone deve estar no formato: 83999999999 (DDD + número)",
		})
		.optional(),
	masterConfirm: z.boolean().optional(),
};

const masterEnrollmentRefine = {
	check: (data: { masterConfirm?: boolean; enrollment?: string }) => {
		if (data.masterConfirm === true) {
			return (
				!!data.enrollment &&
				data.enrollment.length === 9 &&
				/^\d{9}$/.test(data.enrollment)
			);
		}
		return true;
	},
	message:
		"Para se registrar como mestre, é necessário fornecer uma matrícula válida de 9 dígitos",
};

const registerSchema = z.union([
	z
		.object({
			...baseFields,
			email: z.string().email({ message: "Endereço de e-mail inválido" }),
			password: passwordSchema,
		})
		.strict()
		.refine(masterEnrollmentRefine.check, {
			message: masterEnrollmentRefine.message,
			path: ["enrollment"],
		}),
	z
		.object({
			...baseFields,
			googleIdToken: z.string().min(1, { message: "googleIdToken é obrigatório" }),
		})
		.strict()
		.refine(masterEnrollmentRefine.check, {
			message: masterEnrollmentRefine.message,
			path: ["enrollment"],
		}),
]);

export const validateRegister = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = registerSchema.safeParse(req.body);
	if (!result.success) {
		console.error("Validation errors:", result.error.errors);
		return res.status(400).json({ errors: result.error.errors });
	}
	next();
};
