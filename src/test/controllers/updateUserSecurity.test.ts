import type { InMemoryMailService } from "@/mail/inMemoryMailService";
import { makeMailService } from "@/services/factories/makeMailService";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app";
import type { TestUser } from "../helpers";
import { cleanupTestData, createUser } from "../helpers";

const mailService = makeMailService() as InMemoryMailService;

function extractTokenFromMailText(text: string): string {
	const match = text.match(/\?token=([a-f0-9]+)/);
	if (!match) {
		throw new Error(`Token not found in mail text: ${text}`);
	}
	return match[1];
}

describe("Update User Security Controllers", () => {
	let playerToken: string;
	let playerId: string;
	let playerData: TestUser;

	beforeEach(async () => {
		await cleanupTestData();
		mailService.sent = [];

		playerData = await createUser({
			name: "Security Test Player",
			email: "security@example.com",
			password: "OldPassword123!",
			role: "PLAYER",
		});

		playerId = playerData.id;

		const playerAuth = await request(app).post("/users/authenticate").send({
			email: playerData.email,
			password: playerData.password,
		});

		playerToken = playerAuth.body.token;
	});

	describe("PATCH /users/password", () => {
		it("should update user password successfully", async () => {
			const response = await request(app)
				.patch("/users/password")
				.set("Authorization", `Bearer ${playerToken}`)
				.send({
					currentPassword: "OldPassword123!",
					newPassword: "NewPassword456@",
				})
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Senha atualizada com sucesso",
			);

			// Test login with new password
			const newAuth = await request(app).post("/users/authenticate").send({
				email: playerData.email,
				password: "NewPassword456@",
			});
			expect(newAuth.status).toBe(200);
		});

		it("should reject with wrong current password", async () => {
			const response = await request(app)
				.patch("/users/password")
				.set("Authorization", `Bearer ${playerToken}`)
				.send({
					currentPassword: "WrongPassword!",
					newPassword: "NewPassword456@",
				})
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Credenciais inválidas: a senha atual está incorreta",
			);
		});

		it("should reject password that is too weak", async () => {
			const response = await request(app)
				.patch("/users/password")
				.set("Authorization", `Bearer ${playerToken}`)
				.send({
					currentPassword: "OldPassword123!",
					newPassword: "weak", // Fails Zod validation
				})
				.expect(400);

			expect(response.body).toHaveProperty("errors");
		});

		it("should require authentication", async () => {
			await request(app)
				.patch("/users/password")
				.send({
					currentPassword: "OldPassword123!",
					newPassword: "NewPassword456@",
				})
				.expect(401);
		});
	});

	describe("PATCH /users/email", () => {
		it("should keep current email active until the new email is confirmed via link", async () => {
			const response = await request(app)
				.patch("/users/email")
				.set("Authorization", `Bearer ${playerToken}`)
				.send({
					currentPassword: "OldPassword123!",
					newEmail: "new.security@example.com",
				})
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Enviamos um link de confirmação para o novo e-mail. O endereço atual será mantido até a confirmação.",
			);
			expect(response.body.pendingConfirmation).toBe(true);
			expect(response.body.data.email).toBe("security@example.com");

			// Before clicking the link: old email still logs in, new email does not
			await request(app)
				.post("/users/authenticate")
				.send({
					email: "security@example.com",
					password: "OldPassword123!",
				})
				.expect(200);

			await request(app)
				.post("/users/authenticate")
				.send({
					email: "new.security@example.com",
					password: "OldPassword123!",
				})
				.expect(400);

			expect(mailService.sent).toHaveLength(1);
			expect(mailService.sent[0].to).toBe("new.security@example.com");
			const token = extractTokenFromMailText(mailService.sent[0].text);

			// Confirm the pending email change
			await request(app)
				.post("/users/verify-email")
				.send({ token })
				.expect(200);

			// After confirmation: new email logs in, old email no longer works
			await request(app)
				.post("/users/authenticate")
				.send({
					email: "new.security@example.com",
					password: "OldPassword123!",
				})
				.expect(200);

			await request(app)
				.post("/users/authenticate")
				.send({
					email: "security@example.com",
					password: "OldPassword123!",
				})
				.expect(400);
		});

		it("should allow recovering from a typo by requesting another email change and invalidating the previous token", async () => {
			// User types wrong domain by mistake
			await request(app)
				.patch("/users/email")
				.set("Authorization", `Bearer ${playerToken}`)
				.send({
					currentPassword: "OldPassword123!",
					newEmail: "typo@gmial.com",
				})
				.expect(200);

			const wrongToken = extractTokenFromMailText(mailService.sent[0].text);

			// User still logs in normally with original email and requests the right email
			const relogin = await request(app)
				.post("/users/authenticate")
				.send({
					email: "security@example.com",
					password: "OldPassword123!",
				})
				.expect(200);

			await request(app)
				.patch("/users/email")
				.set("Authorization", `Bearer ${relogin.body.token}`)
				.send({
					currentPassword: "OldPassword123!",
					newEmail: "correct.security@example.com",
				})
				.expect(200);

			expect(mailService.sent).toHaveLength(2);
			const rightToken = extractTokenFromMailText(mailService.sent[1].text);

			// Old token for typo@gmial.com is now invalid
			await request(app)
				.post("/users/verify-email")
				.send({ token: wrongToken })
				.expect(400);

			// New token applies the right email
			await request(app)
				.post("/users/verify-email")
				.send({ token: rightToken })
				.expect(200);

			await request(app)
				.post("/users/authenticate")
				.send({
					email: "correct.security@example.com",
					password: "OldPassword123!",
				})
				.expect(200);
		});

		it("should return 409 on confirmation if another user claimed the email in the meantime", async () => {
			await request(app)
				.patch("/users/email")
				.set("Authorization", `Bearer ${playerToken}`)
				.send({
					currentPassword: "OldPassword123!",
					newEmail: "contested@example.com",
				})
				.expect(200);

			const token = extractTokenFromMailText(mailService.sent[0].text);

			await createUser({
				name: "Faster User",
				email: "contested@example.com",
				password: "Password123!",
				role: "PLAYER",
			});

			await request(app)
				.post("/users/verify-email")
				.send({ token })
				.expect(409);
		});

		it("should reject with wrong current password", async () => {
			const response = await request(app)
				.patch("/users/email")
				.set("Authorization", `Bearer ${playerToken}`)
				.send({
					currentPassword: "WrongPassword!",
					newEmail: "new.security@example.com",
				})
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Credenciais inválidas: a senha atual está incorreta",
			);
		});

		it("should reject updating to an email already in use", async () => {
			// Create another user
			await createUser({
				name: "Other User",
				email: "other@example.com",
				password: "Password123!",
				role: "PLAYER",
			});

			const response = await request(app)
				.patch("/users/email")
				.set("Authorization", `Bearer ${playerToken}`)
				.send({
					currentPassword: "OldPassword123!",
					newEmail: "other@example.com", // Belongs to other user
				})
				.expect(409);

			expect(response.body).toHaveProperty(
				"message",
				"O endereço de e-mail fornecido já está em uso",
			);
		});

		it("should require authentication", async () => {
			await request(app)
				.patch("/users/email")
				.send({
					currentPassword: "OldPassword123!",
					newEmail: "new.security@example.com",
				})
				.expect(401);
		});
	});
});
