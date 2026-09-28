import { makeResendVerificationService } from "@/services/factories/makeResendVerificationService";
import type { Request, Response } from "express";
import { z } from "zod";

const schema = z
	.object({
		email: z.string().email(),
	})
	.strict();

export async function resendVerificationController(req: Request, res: Response) {
	const parsed = schema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({ errors: parsed.error.errors });
	}

	try {
		const service = makeResendVerificationService();
		await service.execute(parsed.data);
		return res.status(200).json({
			message:
				"If an account with this email exists and is unverified, a verification email has been sent.",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
}
