import { makeForgotPasswordService } from "@/services/factories/makeForgotPasswordService";
import type { Request, Response } from "express";
import { z } from "zod";

const schema = z
	.object({
		email: z.string().email(),
	})
	.strict();

export async function forgotPasswordController(req: Request, res: Response) {
	const parsed = schema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({ errors: parsed.error.errors });
	}

	try {
		const service = makeForgotPasswordService();
		const { devLink } = await service.execute(parsed.data);
		return res.status(200).json({
			message:
				"If an account with this email exists, a password reset link has been sent.",
			...(devLink ? { devLink } : {}),
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
}
