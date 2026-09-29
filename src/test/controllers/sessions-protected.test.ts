import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app";
import {
	cleanupTestData,
	createSession,
	createSessionWithDates,
	createUser,
	enrollUserInSession,
} from "../helpers";

describe("Protected Sessions Routes", () => {
	let playerToken: string;
	let masterToken: string;
	let adminToken: string;
	let playerId: string;
	let masterId: string;
	let adminId: string;

	beforeEach(async () => {
		await cleanupTestData();

		const player = await createUser({
			email: "player@example.com",
			password: "password123",
			role: "PLAYER",
		});

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

		playerId = player.id;
		masterId = master.id;
		adminId = admin.id;

		const playerAuth = await request(app)
			.post("/users/authenticate")
			.send({ email: player.email, password: player.password });

		const masterAuth = await request(app)
			.post("/users/authenticate")
			.send({ email: master.email, password: master.password });

		const adminAuth = await request(app)
			.post("/users/authenticate")
			.send({ email: admin.email, password: admin.password });

		playerToken = playerAuth.body.token;
		masterToken = masterAuth.body.token;
		adminToken = adminAuth.body.token;
	});

	describe("GET /sessions (Admin only)", () => {
		it("should return all sessions for admin", async () => {
			await createSession({
				title: "Session 1",
				masterId: masterId,
				status: "APROVADA",
			});

			await createSession({
				title: "Session 2",
				masterId: masterId,
				status: "PENDENTE",
			});

			const response = await request(app)
				.get("/sessions")
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveLength(2);
		});

		it("should require admin role", async () => {
			await request(app)
				.get("/sessions")
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(403);

			await request(app)
				.get("/sessions")
				.set("Authorization", `Bearer ${masterToken}`)
				.expect(403);
		});

		it("should require authentication", async () => {
			await request(app).get("/sessions").expect(401);
		});
	});

	describe("POST /sessions/:sessionId/subscribe", () => {
		let sessionId: string;

		beforeEach(async () => {
			const session = await createSession({
				title: "Test Session",
				masterId: masterId,
				status: "APROVADA",
			});
			sessionId = session.id;
		});

		it("should allow player to subscribe to session", async () => {
			const response = await request(app)
				.post(`/sessions/${sessionId}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("message");
		});

		it("should allow master to subscribe to session", async () => {
			const anotherMaster = await createUser({
				email: "master2@example.com",
				password: "password123",
				role: "MASTER",
			});

			const masterAuth = await request(app)
				.post("/users/authenticate")
				.send({ email: anotherMaster.email, password: anotherMaster.password });

			await request(app)
				.post(`/sessions/${sessionId}/subscribe`)
				.set("Authorization", `Bearer ${masterAuth.body.token}`)
				.expect(200);
		});

		it("should not allow admin to subscribe", async () => {
			await request(app)
				.post(`/sessions/${sessionId}/subscribe`)
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(403);
		});

		it("should not allow subscription to non-existent session", async () => {
			const fakeId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

			await request(app)
				.post(`/sessions/${fakeId}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(404);
		});

		it("should require authentication", async () => {
			await request(app).post(`/sessions/${sessionId}/subscribe`).expect(401);
		});

		it("should not allow duplicate subscription", async () => {
			await request(app)
				.post(`/sessions/${sessionId}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			await request(app)
				.post(`/sessions/${sessionId}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(409);
		});

		it("should not allow subscription if session is not APROVADA", async () => {
			const pendingSession = await createSession({
				title: "Pending Session",
				masterId: masterId,
				status: "PENDENTE",
			});

			await request(app)
				.post(`/sessions/${pendingSession.id}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(403);
		});

		it("should not allow subscription if session was approved for a past date", async () => {
			// Criação de sessão com a data já passada
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 1); // Ontem

			const closedSession = await createSession({
				title: "Closed Session",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: pastDate,
			});

			await request(app)
				.post(`/sessions/${closedSession.id}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(403);
		});
	});

	describe("DELETE /sessions/:sessionId/enrollments/me", () => {
		let sessionId: string;

		beforeEach(async () => {
			const session = await createSession({
				title: "Test Session For Cancel",
				masterId: masterId,
				status: "APROVADA",
			});
			sessionId = session.id;
		});

		it("should allow enrolled player to unsubscribe", async () => {
			await request(app)
				.post(`/sessions/${sessionId}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			const response = await request(app)
				.delete(`/sessions/${sessionId}/enrollments/me`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body.message).toBe(
				"Inscrição na sessão cancelada com sucesso",
			);
		});

		it("should return 404 if user is not enrolled", async () => {
			await request(app)
				.delete(`/sessions/${sessionId}/enrollments/me`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(404);
		});

		it("should return 404 for non-existent session", async () => {
			const fakeId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
			await request(app)
				.delete(`/sessions/${fakeId}/enrollments/me`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(404);
		});

		it("should require authentication", async () => {
			await request(app)
				.delete(`/sessions/${sessionId}/enrollments/me`)
				.expect(401);
		});
	});

	describe("DELETE /sessions/:sessionId/cancel (Cancel approved session)", () => {
		it("should allow master to cancel an approved session with reason and 48h+ in advance", async () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);

			const session = await createSession({
				title: "Approved Session To Cancel",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: futureDate,
			});

			const response = await request(app)
				.delete(`/sessions/${session.id}/cancel`)
				.set("Authorization", `Bearer ${masterToken}`)
				.send({ cancelEvent: "Motivo de cancelamento válido aqui" })
				.expect(200);

			expect(response.body).toHaveProperty("message");
		});

		it("should not allow master to cancel with less than 48h in advance", async () => {
			const soonDate = new Date();
			soonDate.setHours(soonDate.getHours() + 10);

			const session = await createSession({
				title: "Imminent Session",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: soonDate,
			});

			await request(app)
				.delete(`/sessions/${session.id}/cancel`)
				.set("Authorization", `Bearer ${masterToken}`)
				.send({ cancelEvent: "Motivo de cancelamento" })
				.expect(403);
		});

		it("should not allow cancellation without a reason", async () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);

			const session = await createSession({
				title: "Session Without Reason",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: futureDate,
			});

			await request(app)
				.delete(`/sessions/${session.id}/cancel`)
				.set("Authorization", `Bearer ${masterToken}`)
				.send({ cancelEvent: "curto" })
				.expect(400);
		});

		it("should not allow a different master to cancel the session", async () => {
			const anotherMaster = await createUser({
				email: "othermaster@example.com",
				password: "password123",
				role: "MASTER",
			});
			const anotherMasterAuth = await request(app)
				.post("/users/authenticate")
				.send({ email: anotherMaster.email, password: anotherMaster.password });

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);

			const session = await createSession({
				title: "Session of Another Master",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: futureDate,
			});

			await request(app)
				.delete(`/sessions/${session.id}/cancel`)
				.set("Authorization", `Bearer ${anotherMasterAuth.body.token}`)
				.send({ cancelEvent: "Tentando cancelar sessão de outro mestre" })
				.expect(403);
		});

		it("should require authentication", async () => {
			const session = await createSession({
				title: "Auth Required Session",
				masterId: masterId,
				status: "APROVADA",
			});

			await request(app)
				.delete(`/sessions/${session.id}/cancel`)
				.send({ cancelEvent: "Motivo de cancelamento válido aqui" })
				.expect(401);
		});
	});

	describe("POST /sessions/:sessionId/subscribe — schedule conflict", () => {
		it("should not allow subscription to two sessions in the same day and period", async () => {
			const sessionDate = new Date();
			sessionDate.setDate(sessionDate.getDate() + 7);

			const firstSession = await createSession({
				title: "First Session",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: sessionDate,
				period: "NOITE",
			});

			const secondSession = await createSession({
				title: "Second Session Same Slot",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: sessionDate,
				period: "NOITE",
			});

			await request(app)
				.post(`/sessions/${firstSession.id}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			await request(app)
				.post(`/sessions/${secondSession.id}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(409);
		});

		it("should not allow subscription to two mesas on the same day even in different periods", async () => {
			const sessionDate = new Date();
			sessionDate.setDate(sessionDate.getDate() + 7);

			const firstSession = await createSession({
				title: "Mesa Manha",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: sessionDate,
				period: "MANHA",
			});

			const secondSession = await createSession({
				title: "Mesa Tarde",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: sessionDate,
				period: "TARDE",
			});

			await request(app)
				.post(`/sessions/${firstSession.id}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			await request(app)
				.post(`/sessions/${secondSession.id}/subscribe`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(409);
		});
	});

	describe("DELETE /sessions/:sessionId/enrollments/me — cancellation window", () => {
		it("should not allow cancellation with less than 24h until session", async () => {
			const soonDate = new Date();
			soonDate.setHours(soonDate.getHours() + 10);

			const session = await createSession({
				title: "Imminent Session For Unenroll",
				masterId: masterId,
				status: "APROVADA",
				approvedDate: soonDate,
			});

			await enrollUserInSession(playerId, session.id);

			await request(app)
				.delete(`/sessions/${session.id}/enrollments/me`)
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(403);
		});
	});

	describe("POST /sessions (Create session)", () => {
		const sessionData = {
			title: "New RPG Session",
			description: "An exciting D&D adventure",
			system: "D&D 5e",
			minPlayers: 3,
			maxPlayers: 5,
			requirements: "Basic knowledge of D&D",
			period: "NOITE",
			possibleDates: ["2025-12-01T19:00:00Z", "2025-12-02T19:00:00Z"],
		};

		it("should allow master to emmit session", async () => {
			const response = await request(app)
				.post("/sessions")
				.set("Authorization", `Bearer ${masterToken}`)
				.send(sessionData)
				.expect(201);

			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveProperty("id");
			expect(response.body.data.title).toBe(sessionData.title);
			expect(response.body.data.description).toBe(sessionData.description);
			expect(response.body.data.status).toBe("PENDENTE");
			expect(response.body.data.minPlayers).toBe(sessionData.minPlayers);
			expect(response.body.data.maxPlayers).toBe(sessionData.maxPlayers);
		});

		it("should not allow player to create session", async () => {
			await request(app)
				.post("/sessions")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(sessionData)
				.expect(403);
		});

		it("should not allow admin to create session", async () => {
			await request(app)
				.post("/sessions")
				.set("Authorization", `Bearer ${adminToken}`)
				.send(sessionData)
				.expect(403);
		});

		it("should validate required fields", async () => {
			const invalidData = {
				title: "Test Session",
			};

			await request(app)
				.post("/sessions")
				.set("Authorization", `Bearer ${masterToken}`)
				.send(invalidData)
				.expect(400);
		});

		it("should require authentication", async () => {
			await request(app).post("/sessions").send(sessionData).expect(401);
		});
	});
});
