import type { Prisma, Category } from "@prisma/client";

export type CategoryWithCount = Category & {
  _count: { posts: number };
};

export interface CategoriesRepository {
  create(data: Prisma.CategoryCreateInput): Promise<Category>;
  delete(id: string): Promise<void>;
  findAll(): Promise<CategoryWithCount[]>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  update(id: string, data: Prisma.CategoryCreateInput): Promise<Category>;
}
