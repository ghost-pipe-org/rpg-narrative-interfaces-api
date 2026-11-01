import { PrismaPostsRepository } from "@/repositories/prisma/prismaPostsRepository";
import { GetPostBySlugService } from "@/services/posts/getPostBySlugService";

export function makeGetPostBySlugService() {
	const postsRepository = new PrismaPostsRepository();
	return new GetPostBySlugService(postsRepository);
}
