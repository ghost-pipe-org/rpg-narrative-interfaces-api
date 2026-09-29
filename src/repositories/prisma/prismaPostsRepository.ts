import { Prisma, Post, PostStatus } from "@prisma/client";
import type {
  PostFilters,
  PostsRepository,
  PostWithRelations,
} from "../postsRepository";
import { prisma } from "@/lib/prisma";

export class PrismaPostsRepository implements PostsRepository {
  async create(data: Prisma.PostCreateInput): Promise<Post> {
    return await prisma.post.create({
      data,
    });
  }

  async update(id: string, data: Prisma.PostUpdateInput): Promise<Post> {
    return await prisma.post.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.post.delete({
      where: {
        id,
      },
    });
  }

  async findById(id: string): Promise<PostWithRelations | null> {
    return await prisma.post.findUnique({
      where: {
        id,
      },
      include: {
        author: {
          select: {
            id: true,
          },
        },
        categories: true,
        categoryName: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<PostWithRelations | null> {
    return await prisma.post.findUnique({
      where: {
        slug,
      },
      include: {
        author: {
          select: {
            id: true,
          },
        },
        categories: true,
        categoryName: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findMany(filters: PostFilters): Promise<PostWithRelations | null> {
    return await prisma.post.findMany({
      where: {
        status: {
          PostStatus,
        },
      },
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await prisma.post.update({
      where: {
        id,
      },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  async slugExists(slug: string): Promise<boolean> {
    const slugSearch = await prisma.post.findUnique({
      where: {
        slug,
      },
    });
    return slugSearch !== null;
  }
}
