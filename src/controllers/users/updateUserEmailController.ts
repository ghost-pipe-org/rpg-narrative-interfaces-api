import { InvalidCredentialsError } from "@/services/errors/invalidCredentialsError";
import { InvalidUserError } from "@/services/errors/invalidUserError";
import { UserAlreadyExistsError } from "@/services/errors/userAlreadyExistsError";
import { makeUpdateUserEmailService } from "@/services/factories/makeUpdateUserEmailService";
import type { Request, Response } from "express";

export async function updateUserEmailController(req: Request, res: Response) {
	try {
		const updateUserEmailService = makeUpdateUserEmailService();

		const userId = (req.user as { id: string }).id;
		const { currentPassword, newEmail } = req.body;

		const { user } = await updateUserEmailService.execute({
			userId,
			currentPasswordRaw: currentPassword,
			newEmail,
		});

		return res.status(200).json({
			message: "E-mail atualizado com sucesso",
			data: user,
		});
	} catch (error) {
		if (error instanceof InvalidUserError) {
			return res.status(404).json({
				message: "Usuário não encontrado",
			});
		}

		if (error instanceof InvalidCredentialsError) {
			return res.status(400).json({
				message: "Credenciais inválidas: a senha atual está incorreta",
			});
		}

		if (error instanceof UserAlreadyExistsError) {
			return res.status(409).json({
				message: "O endereço de e-mail fornecido já está em uso",
			});
		}

		console.error("Error updating user email:", error);
		return res.status(500).json({
			message: "Erro interno no servidor ao atualizar o e-mail",
		});
	}
}
