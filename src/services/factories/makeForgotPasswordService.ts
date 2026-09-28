import { PrismaEmailTokensRepository } from "@/repositories/prisma/prismaEmailTokensRepository";
import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { ForgotPasswordService } from "../users/forgotPasswordService";

export function makeForgotPasswordService() {
	const usersRepository = new PrismaUsersRepository();
	const emailTokensRepository = new PrismaEmailTokensRepository();
	return new ForgotPasswordService(usersRepository, emailTokensRepository);
}
