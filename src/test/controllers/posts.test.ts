import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app";
import { cleanupTestData, createPost, createUser } from "../helpers";

describe("Posts Routes", () => {
	let authorId: string;
	let adminToken: string;

	beforeEach(async () => {
		await cleanupTestData();

		const author = await createUser({
			email: "author@example.com",
			password: "Password123",
			role: "MASTER",
		});

		authorId = author.id;

		const admin = await createUser({
			email: "admin@example.com",
			password: "Password123",
			role: "ADMIN",
		});

		const adminAuth = await request(app)
			.post("/users/authenticate")
			.send({ email: admin.email, password: admin.password });

		adminToken = adminAuth.body.token;
	});

	describe("GET /posts", () => {
		it("should return only published posts without authentication", async () => {
			await createPost({
				title: "Published Post",
				slug: "published-post",
				status: "PUBLICADO",
				authorId,
			});

			await createPost({
				title: "Draft Post",
				slug: "draft-post",
				status: "RASCUNHO",
				authorId,
			});

			const response = await request(app).get("/posts").expect(200);

			expect(response.body.data.posts).toHaveLength(1);
			expect(response.body.data.posts[0].slug).toBe("published-post");
			expect(response.body.data.posts[0].status).toBe("PUBLICADO");
		});

		it("should force status to PUBLICADO when status=RASCUNHO is requested without authentication", async () => {
			await createPost({
				title: "Draft Post",
				slug: "draft-post",
				status: "RASCUNHO",
				authorId,
			});

			const response = await request(app)
				.get("/posts?status=RASCUNHO")
				.expect(200);

			expect(response.body.data.posts).toHaveLength(0);
		});

		it("should allow admin to filter drafts via status=RASCUNHO", async () => {
			await createPost({
				title: "Draft Post",
				slug: "draft-post",
				status: "RASCUNHO",
				authorId,
			});

			await createPost({
				title: "Published Post",
				slug: "published-post",
				status: "PUBLICADO",
				authorId,
			});

			const response = await request(app)
				.get("/posts?status=RASCUNHO")
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200);

			expect(response.body.data.posts).toHaveLength(1);
			expect(response.body.data.posts[0].slug).toBe("draft-post");
			expect(response.body.data.posts[0].status).toBe("RASCUNHO");
		});

		it("should return correct total and totalPages with pagination", async () => {
			for (let i = 1; i <= 7; i++) {
				await createPost({
					title: `Published Post ${i}`,
					slug: `published-post-${i}`,
					status: "PUBLICADO",
					authorId,
				});
			}

			const response = await request(app)
				.get("/posts?page=1&limit=5")
				.expect(200);

			expect(response.body.data.posts).toHaveLength(5);
			expect(response.body.data.total).toBe(7);
			expect(response.body.data.page).toBe(1);
			expect(response.body.data.limit).toBe(5);
			expect(response.body.data.totalPages).toBe(2);
		});
	});

	describe("GET /posts/:slug", () => {
		it("should return a published post", async () => {
			await createPost({
				title: "Published Post",
				slug: "published-post",
				status: "PUBLICADO",
				authorId,
			});

			const response = await request(app)
				.get("/posts/published-post")
				.expect(200);

			expect(response.body.data).toHaveProperty("slug", "published-post");
			expect(response.body.data).toHaveProperty("status", "PUBLICADO");
		});

		it("should return 404 for a draft post without authentication", async () => {
			await createPost({
				title: "Draft Post",
				slug: "draft-post",
				status: "RASCUNHO",
				authorId,
			});

			await request(app).get("/posts/draft-post").expect(404);
		});

		it("should return a draft post to an authenticated admin", async () => {
			await createPost({
				title: "Draft Post",
				slug: "draft-post",
				status: "RASCUNHO",
				authorId,
			});

			const response = await request(app)
				.get("/posts/draft-post")
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200);

			expect(response.body.data).toHaveProperty("slug", "draft-post");
			expect(response.body.data).toHaveProperty("status", "RASCUNHO");
		});

		it("should return 404 for a non-existent post", async () => {
			await request(app).get("/posts/non-existent-post").expect(404);
		});
	});
});
