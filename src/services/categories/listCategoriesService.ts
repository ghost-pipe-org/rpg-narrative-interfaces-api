import type {
	CategoriesRepository,
	CategoryWithCount,
} from "@/repositories/categoriesRepository";

interface ListCategoriesServiceResponse {
	categories: CategoryWithCount[];
}

export class ListCategoriesService {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute(): Promise<ListCategoriesServiceResponse> {
		const categories = await this.categoriesRepository.findAll();

		return {
			categories,
		};
	}
}
