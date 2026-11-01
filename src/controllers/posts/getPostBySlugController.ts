import { PostNotFoundError } from "@/services/errors/postNotFoundError";
import { makeGetPostBySlugService } from "@/services/factories/makeGetPostBySlugService";
import type { Request, Response } from "express";

export async function getPostBySlugController(req: Request, res: Response) {
	const getPostBySlugService = makeGetPostBySlugService();

	const { slug } = req.params;
	const isAdmin = req.user?.role === "ADMIN";

	try {
		const { post } = await getPostBySlugService.execute({ slug, isAdmin });

		return res.status(200).json({ data: post });
	} catch (error) {
		if (error instanceof PostNotFoundError) {
			return res.status(404).json({ message: error.message });
		}

		console.error("Error fetching post by slug:", error);
		return res.status(500).json({ message: "Erro interno no servidor" });
	}
}
