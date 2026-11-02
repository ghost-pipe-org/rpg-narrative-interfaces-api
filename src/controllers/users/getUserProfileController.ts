import { InvalidUserError } from "@/services/errors/invalidUserError";
import { makeGetUserProfileService } from "@/services/factories/makeGetUserProfileService";
import type { Request, Response } from "express";

export async function getUserProfileController(req: Request, res: Response) {
	try {
		const getUserProfileService = makeGetUserProfileService();
		const userId = (req.user as { id: string }).id;

		const profileData = await getUserProfileService.execute({ userId });

		return res.status(200).json({
			message: "Perfil obtido com sucesso",
			data: profileData,
		});
	} catch (error) {
		if (error instanceof InvalidUserError) {
			return res.status(404).json({
				message: error.message,
			});
		}

		console.error("Error fetching user profile:", error);
		return res.status(500).json({
			message: "Erro interno no servidor",
		});
	}
}
