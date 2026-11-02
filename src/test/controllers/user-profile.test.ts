import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app";
import type { TestUser } from "../helpers";
import {
	cleanupTestData,
	createSession,
	createUser,
	enrollUserInSession,
} from "../helpers";

describe("GET /users/profile - User Profile Controller", () => {
	let playerToken: string;
	let masterToken: string;
	let playerId: string;
	let masterId: string;
	let playerData: TestUser;
	let masterData: TestUser;

	beforeEach(async () => {
		await cleanupTestData();

		// Criar usuário PLAYER
		playerData = await createUser({
			name: "Test Player",
			email: "player@example.com",
			password: "Password123",
			role: "PLAYER",
			enrollment: "123456789",
			phoneNumber: "+5511999999999",
		});

		// Criar usuário MASTER
		masterData = await createUser({
			name: "Test Master",
			email: "master@example.com",
			password: "Password123",
			role: "MASTER",
			enrollment: "987654321",
			phoneNumber: "+5511888888888",
		});

		playerId = playerData.id;
		masterId = masterData.id;

		// Autenticar usuários para obter tokens
		const playerAuth = await request(app).post("/users/authenticate").send({
			email: playerData.email,
			password: playerData.password,
		});

		const masterAuth = await request(app).post("/users/authenticate").send({
			email: masterData.email,
			password: masterData.password,
		});

		playerToken = playerAuth.body.token;
		masterToken = masterAuth.body.token;
	});

	describe("Success Cases", () => {
		it("should return complete profile for PLAYER user", async () => {
			// Criar uma sessão e inscrever o player
			const session = await createSession({
				title: "Test Session for Player",
				description: "A test session",
				system: "D&D 5e",
				location: "Test Location",
				minPlayers: 1,
				maxPlayers: 4,
				masterId: masterId,
			});

			await enrollUserInSession(playerId, session.id);

			const response = await request(app)
				.get("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Perfil obtido com sucesso",
			);
			expect(response.body).toHaveProperty("data");

			const { data } = response.body;

			// Verificar dados básicos do usuário (sem senha)
			expect(data).toHaveProperty("user");
			expect(data.user).toMatchObject({
				id: playerId,
				name: playerData.name,
				email: playerData.email,
				enrollment: playerData.enrollment,
				phoneNumber: playerData.phoneNumber,
				role: "PLAYER",
			});
			expect(data.user).not.toHaveProperty("passwordHash");

			// Verificar histórico de atividades
			expect(data).toHaveProperty("emmitedSessions");
			expect(data).toHaveProperty("enrolledSessions");
			expect(data).toHaveProperty("totalEmmited");
			expect(data).toHaveProperty("totalEnrolled");

			// Player não emite sessões
			expect(data.emmitedSessions).toHaveLength(0);
			expect(data.totalEmmited).toBe(0);

			// Player tem uma inscrição
			expect(data.enrolledSessions).toHaveLength(1);
			expect(data.totalEnrolled).toBe(1);
			expect(data.enrolledSessions[0]).toHaveProperty("session");
			expect(data.enrolledSessions[0].session.title).toBe(
				"Test Session for Player",
			);
		});

		it("should return complete profile for MASTER user", async () => {
			// Criar uma sessão emitida pelo master
			const session = await createSession({
				title: "Test Session by Master",
				description: "A test session created by master",
				system: "Pathfinder",
				location: "Master's Location",
				minPlayers: 2,
				maxPlayers: 6,
				masterId: masterId,
			});

			const response = await request(app)
				.get("/users/profile")
				.set("Authorization", `Bearer ${masterToken}`)
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Perfil obtido com sucesso",
			);
			expect(response.body).toHaveProperty("data");

			const { data } = response.body;

			// Verificar dados básicos do usuário
			expect(data).toHaveProperty("user");
			expect(data.user).toMatchObject({
				id: masterId,
				name: masterData.name,
				email: masterData.email,
				enrollment: masterData.enrollment,
				phoneNumber: masterData.phoneNumber,
				role: "MASTER",
			});
			expect(data.user).not.toHaveProperty("passwordHash");

			// Verificar histórico de atividades
			expect(data).toHaveProperty("emmitedSessions");
			expect(data).toHaveProperty("enrolledSessions");

			// Master emitiu uma sessão
			expect(data.emmitedSessions).toHaveLength(1);
			expect(data.totalEmmited).toBe(1);
			expect(data.emmitedSessions[0].title).toBe("Test Session by Master");

			// Master não está inscrito em sessões
			expect(data.enrolledSessions).toHaveLength(0);
			expect(data.totalEnrolled).toBe(0);
		});

		it("should return profile with empty activities for new user", async () => {
			const response = await request(app)
				.get("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			const { data } = response.body;

			expect(data.user).toHaveProperty("id", playerId);
			expect(data.emmitedSessions).toHaveLength(0);
			expect(data.enrolledSessions).toHaveLength(0);
			expect(data.totalEmmited).toBe(0);
			expect(data.totalEnrolled).toBe(0);
		});
	});

	describe("Authentication & Authorization", () => {
		it("should require authentication", async () => {
			await request(app).get("/users/profile").expect(401);
		});

		it("should reject invalid token", async () => {
			await request(app)
				.get("/users/profile")
				.set("Authorization", "Bearer invalid-token")
				.expect(401);
		});

		it("should reject malformed authorization header", async () => {
			await request(app)
				.get("/users/profile")
				.set("Authorization", "InvalidFormat")
				.expect(401);
		});
	});

	describe("Data Security", () => {
		it("should not expose password hash in response", async () => {
			const response = await request(app)
				.get("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			const { data } = response.body;

			expect(data.user).not.toHaveProperty("passwordHash");
			expect(data.user).not.toHaveProperty("password");
		});

		it("should only return data for authenticated user", async () => {
			const response = await request(app)
				.get("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.expect(200);

			// Verificar que retorna dados apenas do usuário autenticado
			expect(response.body.data.user.id).toBe(playerId);
			expect(response.body.data.user.email).toBe(playerData.email);
		});
	});
});
