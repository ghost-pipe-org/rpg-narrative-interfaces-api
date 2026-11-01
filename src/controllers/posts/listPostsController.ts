import { makeListPostsService } from "@/services/factories/makeListPostsService";
import type { PostStatus } from "@prisma/client";
import type { Request, Response } from "express";

export async function listPostsController(req: Request, res: Response) {
	const listPostsService = makeListPostsService();

	const { page, limit, categorySlug, search, status } = req.query;
	const isAdmin = req.user?.role === "ADMIN";

	try {
		const result = await listPostsService.execute({
			page: page ? Number(page) : undefined,
			limit: limit ? Number(limit) : undefined,
			categorySlug: categorySlug ? String(categorySlug) : undefined,
			search: search ? String(search) : undefined,
			status: status ? (String(status) as PostStatus) : undefined,
			isAdmin,
		});

		return res.status(200).json({ data: result });
	} catch (error) {
		console.error("Error fetching posts:", error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
