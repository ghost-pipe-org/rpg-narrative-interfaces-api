import { PrismaEmailTokensRepository } from "@/repositories/prisma/prismaEmailTokensRepository";
import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { UpdateUserEmailService } from "../users/updateUserEmailService";
import { makeMailService } from "./makeMailService";

export function makeUpdateUserEmailService() {
	const usersRepository = new PrismaUsersRepository();
	const emailTokensRepository = new PrismaEmailTokensRepository();
	const updateUserEmailService = new UpdateUserEmailService(
		usersRepository,
		emailTokensRepository,
		makeMailService(),
	);

	return updateUserEmailService;
}
