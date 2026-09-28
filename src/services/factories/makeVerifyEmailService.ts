import { PrismaEmailTokensRepository } from "@/repositories/prisma/prismaEmailTokensRepository";
import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { VerifyEmailService } from "../users/verifyEmailService";

export function makeVerifyEmailService() {
	const usersRepository = new PrismaUsersRepository();
	const emailTokensRepository = new PrismaEmailTokensRepository();
	return new VerifyEmailService(usersRepository, emailTokensRepository);
}
