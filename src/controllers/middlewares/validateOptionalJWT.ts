import { env } from "@/env/index";
/// <reference path="../../@types/express.d.ts" />
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const validateOptionalJWT = () => {
	return (req: Request, res: Response, next: NextFunction) => {
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			return next();
		}

		try {
			const { JWT_SECRET } = env;
			const decoded = jwt.verify(token, JWT_SECRET) as {
				sub: string;
				role: string;
			};

			req.user = { id: decoded.sub, role: decoded.role };
		} catch (error) {
			// Token inválido em rota pública: ignora e segue sem usuário autenticado
		}

		next();
	};
};
