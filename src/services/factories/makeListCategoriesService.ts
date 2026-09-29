import { PrismaCategoriesRepository } from "@/repositories/prisma/prismaCategoriesRepository";
import { ListCategoriesService } from "@/services/categories/listCategoriesService";

export function makeListCategoriesService() {
	const categoriesRepository = new PrismaCategoriesRepository();
	const listCategoriesService = new ListCategoriesService(categoriesRepository);

	return listCategoriesService;
}
