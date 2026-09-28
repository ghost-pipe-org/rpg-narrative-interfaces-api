import { PrismaEmailTokensRepository } from "@/repositories/prisma/prismaEmailTokensRepository";
import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { ResetPasswordService } from "../users/resetPasswordService";

export function makeResetPasswordService() {
	const usersRepository = new PrismaUsersRepository();
	const emailTokensRepository = new PrismaEmailTokensRepository();
	return new ResetPasswordService(usersRepository, emailTokensRepository);
}
