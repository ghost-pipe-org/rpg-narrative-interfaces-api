import { PrismaEmailTokensRepository } from "@/repositories/prisma/prismaEmailTokensRepository";
import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { ForgotPasswordService } from "../users/forgotPasswordService";
import { makeMailService } from "./makeMailService";

export function makeForgotPasswordService() {
	const usersRepository = new PrismaUsersRepository();
	const emailTokensRepository = new PrismaEmailTokensRepository();
	return new ForgotPasswordService(
		usersRepository,
		emailTokensRepository,
		makeMailService(),
	);
}
