import type {
	PostWithRelations,
	PostsRepository,
} from "@/repositories/postsRepository";
import type { PostStatus } from "@prisma/client";

interface ListPostsServiceRequest {
	status?: PostStatus;
	categorySlug?: string;
	search?: string;
	page?: number;
	limit?: number;
	isAdmin?: boolean;
}

interface ListPostsServiceResponse {
	posts: PostWithRelations[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export class ListPostsService {
	constructor(private postsRepository: PostsRepository) {}

	async execute({
		status,
		categorySlug,
		search,
		page = 1,
		limit = 10,
		isAdmin,
	}: ListPostsServiceRequest): Promise<ListPostsServiceResponse> {
		const normalizedPage = Math.max(1, Math.trunc(page));
		const normalizedLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
		const effectiveStatus = isAdmin ? status : "PUBLICADO";

		const { posts, total } = await this.postsRepository.list({
			status: effectiveStatus,
			categorySlug,
			search,
			page: normalizedPage,
			limit: normalizedLimit,
		});

		return {
			posts,
			total,
			page: normalizedPage,
			limit: normalizedLimit,
			totalPages: Math.ceil(total / normalizedLimit),
		};
	}
}
