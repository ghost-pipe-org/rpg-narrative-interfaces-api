import { generateSlug } from "@/lib/slugify";
import type { CategoriesRepository } from "@/repositories/categoriesRepository";
import type { UsersRepository } from "@/repositories/usersRepository";
import { CategoryAlreadyExistsError } from "@/services/errors/categoryAlreadyExistsError";
import { UnauthorizedBlogActionError } from "@/services/errors/unauthorizedBlogActionError";
import type { Category } from "@prisma/client";

interface CreateCategoryServiceRequest {
	name: string;
	authorId: string;
}

interface CreateCategoryServiceResponse {
	category: Category;
}

export class CreateCategoryService {
	constructor(
		private categoriesRepository: CategoriesRepository,
		private usersRepository: UsersRepository,
	) {}

	async execute({
		name,
		authorId,
	}: CreateCategoryServiceRequest): Promise<CreateCategoryServiceResponse> {
		const user = await this.usersRepository.findById(authorId);

		if (!user || user.role !== "ADMIN") {
			throw new UnauthorizedBlogActionError();
		}

		const slug = generateSlug(name);
		const categoryWithSameSlug =
			await this.categoriesRepository.findBySlug(slug);

		if (categoryWithSameSlug) {
			throw new CategoryAlreadyExistsError();
		}

		const category = await this.categoriesRepository.create({
			name,
			slug,
		});

		return {
			category,
		};
	}
}
