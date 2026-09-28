import { validationErrorBody } from "@/lib/validationError";
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
	enrollment: z.string().optional(),
	phoneNumber: z
		.string()
		.regex(/^\d{10,11}$/, {
			message:
				"Telefone deve estar no formato: 83999999999 (DDD + número)",
		})
		.optional(),
	masterConfirm: z.boolean().optional(),
};

const MASTER_ENROLLMENT_MESSAGE =
	"Para se registrar como mestre, é necessário fornecer uma matrícula válida de 9 dígitos";

function withEnrollmentRules<
	T extends z.ZodType<{ masterConfirm?: boolean; enrollment?: string }>,
>(schema: T) {
	return schema.superRefine((data, ctx) => {
		const enrollment = data.enrollment?.trim() ?? "";
		const hasEnrollment = enrollment.length > 0;
		const isValidEnrollment = /^\d{9}$/.test(enrollment);

		if (hasEnrollment && !isValidEnrollment) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Matrícula deve ter exatamente 9 dígitos",
				path: ["enrollment"],
			});
			return;
		}

		if (data.masterConfirm === true && !isValidEnrollment) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: MASTER_ENROLLMENT_MESSAGE,
				path: ["enrollment"],
			});
		}
	});
}

const registerSchema = z.union([
	withEnrollmentRules(
		z
			.object({
				...baseFields,
				email: z.string().email({ message: "Endereço de e-mail inválido" }),
				password: passwordSchema,
			})
			.strict(),
	),
	withEnrollmentRules(
		z
			.object({
				...baseFields,
				googleIdToken: z
					.string()
					.min(1, { message: "googleIdToken é obrigatório" }),
			})
			.strict(),
	),
]);

export const validateRegister = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = registerSchema.safeParse(req.body);
	if (!result.success) {
		return res.status(400).json(validationErrorBody(result.error));
	}
	next();
};
