import { InvalidCredentialsError } from "@/services/errors/invalidCredentialsError";
import { InvalidUserError } from "@/services/errors/invalidUserError";
import { makeUpdateUserPasswordService } from "@/services/factories/makeUpdateUserPasswordService";
import type { Request, Response } from "express";

export async function updateUserPasswordController(
	req: Request,
	res: Response,
) {
	try {
		const updateUserPasswordService = makeUpdateUserPasswordService();

		const userId = (req.user as { id: string }).id;
		const { currentPassword, newPassword } = req.body;

		await updateUserPasswordService.execute({
			userId,
			currentPasswordRaw: currentPassword,
			newPasswordRaw: newPassword,
		});

		return res.status(200).json({
			message: "Senha atualizada com sucesso",
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

		console.error("Error updating user password:", error);
		return res.status(500).json({
			message: "Erro interno no servidor ao atualizar a senha",
		});
	}
}
