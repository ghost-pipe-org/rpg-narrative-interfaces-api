import { InvalidUserError } from "@/services/errors/invalidUserError";
import { NoDataToUpdateError } from "@/services/errors/noDataToUpdateError";
import { makeUpdateUserProfileService } from "@/services/factories/makeUpdateUserProfileService";
import type { Request, Response } from "express";

export async function updateUserProfileController(req: Request, res: Response) {
	try {
		const updateUserProfileService = makeUpdateUserProfileService();

		const userId = (req.user as { id: string }).id;
		const { name, phoneNumber } = req.body;

		const { user } = await updateUserProfileService.execute({
			userId,
			name,
			phoneNumber,
		});

		return res.status(200).json({
			message: "Perfil atualizado com sucesso",
			data: user,
		});
	} catch (error) {
		if (error instanceof InvalidUserError) {
			return res.status(404).json({
				message: "Usuário não encontrado",
			});
		}

		if (error instanceof NoDataToUpdateError) {
			return res.status(400).json({
				message: "Nenhum dado válido fornecido para atualização",
			});
		}

		console.error("Error updating user profile:", error);
		return res.status(500).json({
			message: "Erro interno no servidor",
		});
	}
}
