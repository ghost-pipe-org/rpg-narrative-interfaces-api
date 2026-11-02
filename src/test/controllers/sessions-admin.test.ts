import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app";
import {
	cleanupTestData,
	createSession,
	createSessionWithDates,
	createUser,
} from "../helpers";

describe("Session Administration Routes", () => {
	let adminToken: string;
	let masterToken: string;
	let playerToken: string;
	let masterId: string;
	let adminId: string;

	beforeEach(async () => {
		await cleanupTestData();

		const master = await createUser({
			email: "master@example.com",
			password: "password123",
			role: "MASTER",
		});

		const admin = await createUser({
			email: "admin@example.com",
			password: "password123",
			role: "ADMIN",
		});

		const player = await createUser({
			email: "player@example.com",
			password: "password123",
			role: "PLAYER",
		});

		masterId = master.id;
		adminId = admin.id;

		const masterAuth = await request(app)
			.post("/users/authenticate")
			.send({ email: master.email, password: master.password });

		const adminAuth = await request(app)
			.post("/users/authenticate")
			.send({ email: admin.email, password: admin.password });

		const playerAuth = await request(app)
			.post("/users/authenticate")
			.send({ email: player.email, password: player.password });

		masterToken = masterAuth.body.token;
		adminToken = adminAuth.body.token;
		playerToken = playerAuth.body.token;
	});

	describe("PATCH /sessions/:sessionId/approve", () => {
		let sessionId: string;

		beforeEach(async () => {
			const session = await createSessionWithDates(
				{
					title: "Pending Session",
					masterId: masterId,
					status: "PENDENTE",
				},
				[new Date("2025-12-01T19:00:00Z")],
			);

			sessionId = session.id;
		});

		it("should allow admin to approve session", async () => {
			const approvalData = {
				approvedDate: "2025-12-01T19:00:00Z",
				location: "Test Location",
			};

			const response = await request(app)
				.patch(`/sessions/${sessionId}/approve`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send(approvalData)
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body.message).toBe("Sessão aprovada com sucesso");
		});

		it("should not allow master to approve session", async () => {
			const approvalData = {
				approvedDate: "2025-12-01T19:00:00Z",
				location: "Test Location",
			};

			await request(app)
				.patch(`/sessions/${sessionId}/approve`)
				.set("Authorization", `Bearer ${masterToken}`)
				.send(approvalData)
				.expect(403);
		});

		it("should not allow player to approve session", async () => {
			const approvalData = {
				approvedDate: "2025-12-01T19:00:00Z",
				location: "Test Location",
			};

			await request(app)
				.patch(`/sessions/${sessionId}/approve`)
				.set("Authorization", `Bearer ${playerToken}`)
				.send(approvalData)
				.expect(403);
		});

		it("should require valid approved date", async () => {
			const approvalData = {
				approvedDate: "invalid-date",
			};

			await request(app)
				.patch(`/sessions/${sessionId}/approve`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send(approvalData)
				.expect(400);
		});

		it("should require approved date to be one of possible dates", async () => {
			const approvalData = {
				approvedDate: "2025-12-25T19:00:00Z",
				location: "Test Location",
			};

			await request(app)
				.patch(`/sessions/${sessionId}/approve`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send(approvalData)
				.expect(404);
		});

		it("should not approve non-existent session", async () => {
			const fakeId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
			const approvalData = {
				approvedDate: "2025-12-01T19:00:00Z",
				location: "Test Location",
			};

			await request(app)
				.patch(`/sessions/${fakeId}/approve`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send(approvalData)
				.expect(404);
		});

		it("should not approve already approved session", async () => {
			const approvalData = {
				approvedDate: "2025-12-01T19:00:00Z",
				location: "Test Location",
			};

			await request(app)
				.patch(`/sessions/${sessionId}/approve`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send(approvalData)
				.expect(200);

			await request(app)
				.patch(`/sessions/${sessionId}/approve`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send(approvalData)
				.expect(400);
		});

		it("should require authentication", async () => {
			const approvalData = {
				approvedDate: "2025-12-01T19:00:00Z",
				location: "Test Location",
			};

			await request(app)
				.patch(`/sessions/${sessionId}/approve`)
				.send(approvalData)
				.expect(401);
		});
	});

	describe("PATCH /sessions/:sessionId/reject", () => {
		let sessionId: string;

		beforeEach(async () => {
			const session = await createSession({
				title: "Pending Session",
				masterId: masterId,
				status: "PENDENTE",
			});

			sessionId = session.id;
		});

		it("should allow admin to reject session", async () => {
			const rejectionData = {
				cancelEvent: "Session rejected due to inappropriate content",
			};

			const response = await request(app)
				.patch(`/sessions/${sessionId}/reject`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send(rejectionData)
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body.message).toBe("Sessão rejeitada com sucesso");
		});

		it("should not allow master to reject session", async () => {
			const rejectionData = {
				cancelEvent: "Rejection reason",
			};

			await request(app)
				.patch(`/sessions/${sessionId}/reject`)
				.set("Authorization", `Bearer ${masterToken}`)
				.send(rejectionData)
				.expect(403);
		});

		it("should not allow player to reject session", async () => {
			const rejectionData = {
				cancelEvent: "Rejection reason",
			};

			await request(app)
				.patch(`/sessions/${sessionId}/reject`)
				.set("Authorization", `Bearer ${playerToken}`)
				.send(rejectionData)
				.expect(403);
		});

		it("should allow rejection without cancel event", async () => {
			const response = await request(app)
				.patch(`/sessions/${sessionId}/reject`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({})
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body.message).toBe("Sessão rejeitada com sucesso");
		});

		it("should not reject non-existent session", async () => {
			const fakeId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

			await request(app)
				.patch(`/sessions/${fakeId}/reject`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({})
				.expect(404);
		});

		it("should not reject already rejected session", async () => {
			await request(app)
				.patch(`/sessions/${sessionId}/reject`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({})
				.expect(200);

			await request(app)
				.patch(`/sessions/${sessionId}/reject`)
				.set("Authorization", `Bearer ${adminToken}`)
				.send({})
				.expect(400);
		});

		it("should require authentication", async () => {
			await request(app)
				.patch(`/sessions/${sessionId}/reject`)
				.send({})
				.expect(401);
		});
	});
});
