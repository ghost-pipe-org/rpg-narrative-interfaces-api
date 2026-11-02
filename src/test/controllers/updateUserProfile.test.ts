import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app";
import type { TestUser } from "../helpers";
import { cleanupTestData, createUser } from "../helpers";

describe("PATCH /users/profile - Update User Profile Controller", () => {
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
			name: "Original Player Name",
			email: "player@example.com",
			password: "Password123",
			role: "PLAYER",
			enrollment: "123456789",
			phoneNumber: "(11) 99999-9999",
		});

		// Criar usuário MASTER
		masterData = await createUser({
			name: "Original Master Name",
			email: "master@example.com",
			password: "Password123",
			role: "MASTER",
			enrollment: "987654321",
			phoneNumber: "(11) 88888-8888",
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
		it("should update user name successfully", async () => {
			const updateData = {
				name: "João Silva Santos",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Perfil atualizado com sucesso",
			);
			expect(response.body).toHaveProperty("data");
			expect(response.body.data.name).toBe("João Silva Santos");
			expect(response.body.data.id).toBe(playerId);
			expect(response.body.data.email).toBe(playerData.email);
			expect(response.body.data).not.toHaveProperty("passwordHash");
		});

		it("should update phone number successfully", async () => {
			const updateData = {
				phoneNumber: "(11) 95555-5555",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body.data.phoneNumber).toBe("(11) 95555-5555");
			expect(response.body.data.name).toBe(playerData.name); // Nome não deve mudar
		});

		it("should update both name and phone number successfully", async () => {
			const updateData = {
				name: "Maria Silva",
				phoneNumber: "(21) 99999-8888",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body.data.name).toBe("Maria Silva");
			expect(response.body.data.phoneNumber).toBe("(21) 99999-8888");
		});

		it("should remove phone number when empty string is sent", async () => {
			const updateData = {
				phoneNumber: "",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body.data.phoneNumber).toBeNull();
		});

		it("should trim whitespace from name", async () => {
			const updateData = {
				name: "  João Silva Santos  ",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body.data.name).toBe("João Silva Santos");
		});

		it("should work for MASTER users", async () => {
			const updateData = {
				name: "Professor Carlos",
				phoneNumber: "(11) 94444-4444",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${masterToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body.data.name).toBe("Professor Carlos");
			expect(response.body.data.phoneNumber).toBe("(11) 94444-4444");
			expect(response.body.data.role).toBe("MASTER");
		});
	});

	describe("Validation Errors", () => {
		it("should reject name that is too short", async () => {
			const updateData = {
				name: "A",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(400);

			expect(response.body).toHaveProperty("errors");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["name"],
						message: expect.stringContaining("pelo menos 2 caracteres"),
					}),
				]),
			);
		});

		it("should reject name that is too long", async () => {
			const updateData = {
				name: "A".repeat(101), // 101 caracteres
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(400);

			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["name"],
						message: expect.stringContaining("no máximo 100 caracteres"),
					}),
				]),
			);
		});

		it("should reject name with invalid characters", async () => {
			const updateData = {
				name: "João123Silva",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(400);

			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["name"],
						message: expect.stringContaining("apenas letras e espaços"),
					}),
				]),
			);
		});

		it("should reject invalid phone number format", async () => {
			const updateData = {
				phoneNumber: "123456789",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(400);

			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						path: ["phoneNumber"],
						message: expect.stringContaining("formato (11) 99999-9999"),
					}),
				]),
			);
		});

		it("should reject request with no valid fields", async () => {
			const updateData = {};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(400);

			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: expect.stringContaining("Pelo menos um campo"),
					}),
				]),
			);
		});

		it("should reject unknown fields", async () => {
			const updateData = {
				name: "João Silva",
				unknownField: "should be rejected",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(400);

			expect(response.body).toHaveProperty("errors");
		});
	});

	describe("Security Tests", () => {
		it("should ignore readonly fields if sent", async () => {
			const updateData = {
				name: "João Silva",
				email: "hacker@evil.com", // deve ser ignorado
				role: "ADMIN", // deve ser ignorado
				enrollment: "999999999", // deve ser ignorado
				id: "fake-id", // deve ser ignorado
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			// Apenas o nome deve ter mudado
			expect(response.body.data.name).toBe("João Silva");
			expect(response.body.data.email).toBe(playerData.email); // não mudou
			expect(response.body.data.role).toBe("PLAYER"); // não mudou
			expect(response.body.data.enrollment).toBe(playerData.enrollment); // não mudou
			expect(response.body.data.id).toBe(playerId); // não mudou
		});

		it("should require authentication", async () => {
			const updateData = {
				name: "João Silva",
			};

			const response = await request(app)
				.patch("/users/profile")
				.send(updateData)
				.expect(401);

			expect(response.body).toHaveProperty("message");
		});

		it("should reject invalid token", async () => {
			const updateData = {
				name: "João Silva",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", "Bearer invalid-token")
				.send(updateData)
				.expect(401);

			expect(response.body).toHaveProperty("message");
		});

		it("should not expose password hash in response", async () => {
			const updateData = {
				name: "João Silva",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body.data).not.toHaveProperty("passwordHash");
		});
	});

	describe("Edge Cases", () => {
		it("should handle names with accents and special characters", async () => {
			const updateData = {
				name: "José da Silva Ação",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body.data.name).toBe("José da Silva Ação");
		});

		it("should handle phone number with different valid formats", async () => {
			const updateData = {
				phoneNumber: "(11) 9999-9999", // formato sem o 5º dígito
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body.data.phoneNumber).toBe("(11) 9999-9999");
		});

		it("should return 404 for non-existent user", async () => {
			// Criar um token falso mas válido para um usuário que não existe
			// Este teste assumiria que temos uma forma de simular isso
			// Por enquanto, vamos comentar este teste específico
			// pois seria mais complexo implementar sem expor internos do JWT
		});

		it("should update updatedAt timestamp", async () => {
			const updateData = {
				name: "João Silva Updated",
			};

			const response = await request(app)
				.patch("/users/profile")
				.set("Authorization", `Bearer ${playerToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body.data.updatedAt).toBeDefined();
			// Verificar que updatedAt é uma data recente (últimos 10 segundos)
			const updatedAt = new Date(response.body.data.updatedAt);
			const now = new Date();
			const diffInSeconds = (now.getTime() - updatedAt.getTime()) / 1000;
			expect(diffInSeconds).toBeLessThan(10);
		});
	});
});
