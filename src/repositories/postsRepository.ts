import type { Post, PostStatus, Prisma } from "@prisma/client";

export type PostWithRelations = Post & {
	author: {
		id: string;
		name: string;
		email: string;
	};
	categories: {
		category: {
			id: string;
			name: string;
			slug: string;
		};
	}[];
};

export interface ListPostsFilters {
	status?: PostStatus;
	categorySlug?: string;
	search?: string;
	page: number;
	limit: number;
}

export interface ListPostsResult {
	posts: PostWithRelations[];
	total: number;
}

export interface PostsRepository {
	findBySlug(slug: string): Promise<PostWithRelations | null>;
	incrementViewCount(id: string): Promise<void>;
	list(filters: ListPostsFilters): Promise<ListPostsResult>;
}

export type PostWhereInput = Prisma.PostWhereInput;
