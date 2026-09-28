import { env } from "@/env/index";
import { MasterRequiresEnrollmentError } from "@/services/errors/masterRequiresEnrollmentError";
import { UserAlreadyExistsError } from "@/services/errors/userAlreadyExistsError";
import { InvalidCredentialsError } from "@/services/errors/invalidCredentialsError";
import { makeRegisterService } from "@/services/factories/makeRegisterService";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export async function registerController(req: Request, res: Response) {
	const {
		name,
		email,
		password,
		googleIdToken,
		enrollment,
		phoneNumber,
		masterConfirm,
	} = req.body;

	try {
		const registerService = makeRegisterService();

		const { user, requiresEmailVerification } = await registerService.execute({
			name,
			email,
			password,
			googleIdToken,
			enrollment,
			phoneNumber,
			masterConfirm,
		});

		if (requiresEmailVerification) {
			return res.status(201).json({
				message:
					"User registered successfully. Please verify your email before logging in.",
				requiresEmailVerification: true,
			});
		}

		const { JWT_SECRET } = env;
		const userInfo = {
			id: user.id,
			name: user.name,
			enrollment: user.enrollment,
			email: user.email,
			role: user.role,
			phoneNumber: user.phoneNumber,
		};

		const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
			expiresIn: "7d",
		});

		return res.status(201).json({
			message: "User registered successfully",
			requiresEmailVerification: false,
			token,
			user: userInfo,
		});
	} catch (error) {
		if (error instanceof UserAlreadyExistsError) {
			return res.status(409).json({ message: error.message });
		}
		if (error instanceof MasterRequiresEnrollmentError) {
			return res.status(400).json({ message: error.message });
		}
		if (error instanceof InvalidCredentialsError) {
			return res.status(400).json({ message: error.message });
		}
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
}
