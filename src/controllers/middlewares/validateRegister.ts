import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const passwordSchema = z
	.string()
	.min(6, { message: "Password must be at least 6 characters long" })
	.regex(/[A-Z]/, {
		message: "Password must contain at least one uppercase letter",
	})
	.regex(/[0-9]/, { message: "Password must contain at least one number" });

const baseFields = {
	name: z.string().min(1, { message: "Name is required" }),
	enrollment: z
		.string()
		.regex(/^\d{9}$/)
		.or(z.literal(""))
		.optional(),
	phoneNumber: z
		.string()
		.regex(/^\d{10,11}$/, {
			message:
				"Phone number must be in format: 83999999999 (area code + number)",
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
			email: z.string().email({ message: "Invalid email address" }),
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
			googleIdToken: z.string().min(1, { message: "googleIdToken is required" }),
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
