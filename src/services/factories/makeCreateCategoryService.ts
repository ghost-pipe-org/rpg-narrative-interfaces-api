import { PrismaCategoriesRepository } from "@/repositories/prisma/prismaCategoriesRepository";
import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { CreateCategoryService } from "@/services/categories/createCategoryService";

export function makeCreateCategoryService() {
	const categoriesRepository = new PrismaCategoriesRepository();
	const usersRepository = new PrismaUsersRepository();
	const createCategoryService = new CreateCategoryService(
		categoriesRepository,
		usersRepository,
	);

	return createCategoryService;
}
