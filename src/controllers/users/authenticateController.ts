import { env } from "@/env/index";
import { EmailNotVerifiedError } from "@/services/errors/emailNotVerifiedError";
import { InvalidCredentialsError } from "@/services/errors/invalidCredentialsError";
import { UserRegistrationRequiredError } from "@/services/errors/userRegistrationRequiredError";
import { makeAuthenticateService } from "@/services/factories/makeAuthenticateService";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export async function authenticateController(req: Request, res: Response) {
	const { email, password, googleIdToken } = req.body;

	try {
		const authenticateService = makeAuthenticateService();

		const { user } = await authenticateService.execute({
			email,
			password,
			googleIdToken,
		});

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
		return res.status(200).json({
			message: "Usuário autenticado com sucesso",
			token,
			user: userInfo,
		});
	} catch (error) {
		if (
			error instanceof UserRegistrationRequiredError ||
			(error instanceof Error && error.name === "UserRegistrationRequiredError")
		) {
			return res.status(404).json({
				message:
					error instanceof Error
						? error.message
						: "Conta Google não vinculada, crie uma conta para poder fazer login",
				code: "REGISTRATION_REQUIRED",
			});
		}
		if (
			error instanceof EmailNotVerifiedError ||
			(error instanceof Error && error.name === "EmailNotVerifiedError")
		) {
			return res.status(403).json({
				message:
					error instanceof Error
						? error.message
						: "É necessário verificar o e-mail para ativar a conta.",
				code: "EMAIL_NOT_VERIFIED",
			});
		}
		if (error instanceof InvalidCredentialsError) {
			return res.status(400).json({ message: error.message });
		}
		console.error(error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
