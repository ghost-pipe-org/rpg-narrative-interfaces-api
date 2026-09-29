import type {
  Prisma,
  Post,
  User,
  PostCategory,
  PostStatus,
  Category,
} from "@prisma/client";

export type PostWithRelations = Post & {
  author: Pick<User, "id">;
  categories: PostCategory[];
  categoryName: Pick<Category, "name">;
};

export type PostFilters = {
  status?: PostStatus;
  categorySlug?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export interface PostsRepository {
  create(data: Prisma.PostCreateInput): Promise<Post>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<PostWithRelations | null>;
  findBySlug(slug: string): Promise<PostWithRelations | null>;
  findMany(filters: PostFilters): Promise<PostWithRelations | null>;
  incrementViewCount(id: string): Promise<void>;
  slugExists(slug: string): Promise<boolean>;
  update(id: string, data: Prisma.PostUpdateInput): Promise<Post>;
}
