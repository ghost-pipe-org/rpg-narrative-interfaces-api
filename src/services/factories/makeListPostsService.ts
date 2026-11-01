import { PrismaPostsRepository } from "@/repositories/prisma/prismaPostsRepository";
import { ListPostsService } from "@/services/posts/listPostsService";

export function makeListPostsService() {
	const postsRepository = new PrismaPostsRepository();
	return new ListPostsService(postsRepository);
}
