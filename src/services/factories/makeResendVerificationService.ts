import { PrismaEmailTokensRepository } from "@/repositories/prisma/prismaEmailTokensRepository";
import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { ResendVerificationService } from "../users/resendVerificationService";
import { makeMailService } from "./makeMailService";

export function makeResendVerificationService() {
	const usersRepository = new PrismaUsersRepository();
	const emailTokensRepository = new PrismaEmailTokensRepository();
	return new ResendVerificationService(
		usersRepository,
		emailTokensRepository,
		makeMailService(),
	);
}
