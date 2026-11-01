import { prisma } from "@/lib/prisma";
import type {
	ListPostsFilters,
	PostWhereInput,
	PostsRepository,
} from "../postsRepository";

const postInclude = {
	author: {
		select: {
			id: true,
			name: true,
			email: true,
		},
	},
	categories: {
		include: {
			category: {
				select: {
					id: true,
					name: true,
					slug: true,
				},
			},
		},
	},
} as const;

export class PrismaPostsRepository implements PostsRepository {
	async findBySlug(slug: string) {
		return prisma.post.findUnique({
			where: { slug },
			include: postInclude,
		});
	}

	async incrementViewCount(id: string) {
		await prisma.post.update({
			where: { id },
			data: {
				viewCount: {
					increment: 1,
				},
			},
		});
	}

	async list({ status, categorySlug, search, page, limit }: ListPostsFilters) {
		const where: PostWhereInput = {};
		const normalizedSearch = search?.trim();

		if (status) {
			where.status = status;
		}

		if (categorySlug) {
			where.categories = {
				some: {
					category: {
						slug: categorySlug,
					},
				},
			};
		}

		if (normalizedSearch) {
			where.OR = [
				{
					title: {
						contains: normalizedSearch,
						mode: "insensitive",
					},
				},
				{
					summary: {
						contains: normalizedSearch,
						mode: "insensitive",
					},
				},
				{
					content: {
						contains: normalizedSearch,
						mode: "insensitive",
					},
				},
			];
		}

		const [posts, total] = await Promise.all([
			prisma.post.findMany({
				where,
				include: postInclude,
				orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.post.count({ where }),
		]);

		return {
			posts,
			total,
		};
	}
}
