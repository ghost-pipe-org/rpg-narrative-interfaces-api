import type {
	PostWithRelations,
	PostsRepository,
} from "@/repositories/postsRepository";
import { PostNotFoundError } from "@/services/errors/postNotFoundError";

interface GetPostBySlugServiceRequest {
	slug: string;
	isAdmin?: boolean;
}

interface GetPostBySlugServiceResponse {
	post: PostWithRelations;
}

export class GetPostBySlugService {
	constructor(private postsRepository: PostsRepository) {}

	async execute({
		slug,
		isAdmin,
	}: GetPostBySlugServiceRequest): Promise<GetPostBySlugServiceResponse> {
		const post = await this.postsRepository.findBySlug(slug);

		if (!post) {
			throw new PostNotFoundError();
		}

		if (!isAdmin && post.status !== "PUBLICADO") {
			throw new PostNotFoundError();
		}

		void this.postsRepository.incrementViewCount(post.id);

		return {
			post,
		};
	}
}
