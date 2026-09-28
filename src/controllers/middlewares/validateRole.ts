import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

type RequiredRole = UserRole | UserRole[];

export const validateRole = (requiredRoles: RequiredRole) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// req.user é garantido pelo validateJWT que roda antes
			const userId = (req.user as { id: string }).id;

			const usersRepository = new PrismaUsersRepository();
			const user = await usersRepository.findById(userId);

			// user é garantido existir pois passou pelo validateJWT
			const userRole = user?.role as UserRole;

			// Converte para array se for um role único
			const allowedRoles = Array.isArray(requiredRoles)
				? requiredRoles
				: [requiredRoles];

			// Verifica se o usuário tem pelo menos um dos roles necessários
			if (!allowedRoles.includes(userRole)) {
				return res.status(403).json({
					message: "Acesso negado. Permissões insuficientes.",
					required: allowedRoles,
					current: userRole,
				});
			}

			next();
		} catch (error) {
			console.error("Error validating role:", error);
			return res.status(500).json({ message: "Erro interno no servidor" });
		}
	};
};
