import { PrismaEmailTokensRepository } from "@/repositories/prisma/prismaEmailTokensRepository";
import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { AuthenticateService } from "../users/authenticateService";
import { ResendVerificationService } from "../users/resendVerificationService";
import { makeMailService } from "./makeMailService";

export function makeAuthenticateService() {
	const usersRepository = new PrismaUsersRepository();
	const emailTokensRepository = new PrismaEmailTokensRepository();
	const resendVerificationService = new ResendVerificationService(
		usersRepository,
		emailTokensRepository,
		makeMailService(),
	);
	return new AuthenticateService(usersRepository, resendVerificationService);
}
