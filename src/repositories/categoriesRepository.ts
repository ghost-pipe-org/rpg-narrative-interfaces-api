import type { Category, Prisma } from "@prisma/client";

export type CategoryWithCount = Category & {
	_count: {
		posts: number;
	};
};

export interface CategoriesRepository {
	create(data: Prisma.CategoryCreateInput): Promise<Category>;
	update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category>;
	delete(id: string): Promise<void>;
	findById(id: string): Promise<Category | null>;
	findBySlug(slug: string): Promise<Category | null>;
	findAll(): Promise<CategoryWithCount[]>;
}
