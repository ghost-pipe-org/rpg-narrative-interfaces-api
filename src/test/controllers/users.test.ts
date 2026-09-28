import { verifyGoogleIdToken } from "@/lib/googleAuth";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../app";
import {
	cleanupTestData,
	createEmailToken,
	createUser,
	prisma,
} from "../helpers";

vi.mock("@/lib/googleAuth", () => ({
	verifyGoogleIdToken: vi.fn(),
}));

const mockedVerifyGoogleIdToken = vi.mocked(verifyGoogleIdToken);

describe("Users Authentication", () => {
	beforeEach(async () => {
		await cleanupTestData();
		mockedVerifyGoogleIdToken.mockReset();
	});

	describe("POST /users", () => {
		it("should register a new user successfully and require email verification", async () => {
			const userData = {
				name: "John Doe",
				email: "john@example.com",
				password: "Password123",
				masterConfirm: false,
			};

			const response = await request(app)
				.post("/users")
				.send(userData)
				.expect(201);

			expect(response.body.requiresEmailVerification).toBe(true);
			expect(response.body.message).toContain("verify your email");

			const user = await prisma.user.findUnique({
				where: { email: userData.email },
			});
			expect(user?.emailVerified).toBe(false);
		});

		it("should not register user with duplicate email", async () => {
			const userData = {
				name: "John Doe",
				email: "john@example.com",
				password: "Password123",
				masterConfirm: false,
			};

			await request(app).post("/users").send(userData).expect(201);

			const response = await request(app)
				.post("/users")
				.send(userData)
				.expect(409);

			expect(response.body).toHaveProperty("message");
		});

		it("should not register user with invalid email", async () => {
			const userData = {
				name: "John Doe",
				email: "invalid-email",
				password: "Password123",
				masterConfirm: false,
			};

			const response = await request(app)
				.post("/users")
				.send(userData)
				.expect(400);

			expect(response.body).toHaveProperty("errors");
		});

		it("should not register user with missing required fields", async () => {
			const userData = {
				email: "john@example.com",
			};

			const response = await request(app)
				.post("/users")
				.send(userData)
				.expect(400);

			expect(response.body).toHaveProperty("errors");
		});

		it("should register master user successfully", async () => {
			const userData = {
				name: "Master John",
				email: "master@example.com",
				password: "Password123",
				masterConfirm: true,
				enrollment: "123456789",
				phoneNumber: "11999999999",
			};

			const response = await request(app)
				.post("/users")
				.send(userData)
				.expect(201);

			expect(response.body.requiresEmailVerification).toBe(true);
		});

		it("should register google user without password and return token", async () => {
			mockedVerifyGoogleIdToken.mockResolvedValue({
				googleId: "google-sub-register",
				email: "google.register@example.com",
				name: "Google User",
				emailVerified: true,
			});

			const response = await request(app)
				.post("/users")
				.send({
					name: "Google User",
					googleIdToken: "fake-google-id-token",
					masterConfirm: false,
				})
				.expect(201);

			expect(response.body.requiresEmailVerification).toBe(false);
			expect(response.body).toHaveProperty("token");
			expect(response.body.user.email).toBe("google.register@example.com");

			const user = await prisma.user.findUnique({
				where: { email: "google.register@example.com" },
			});
			expect(user?.passwordHash).toBeNull();
			expect(user?.emailVerified).toBe(true);
			expect(user?.googleId).toBe("google-sub-register");
		});
	});

	describe("POST /users/authenticate", () => {
		it("should authenticate user with valid credentials", async () => {
			const user = await createUser({
				email: "john@example.com",
				password: "Password123",
			});

			const response = await request(app)
				.post("/users/authenticate")
				.send({
					email: user.email,
					password: user.password,
				})
				.expect(200);

			expect(response.body).toHaveProperty("token");
			expect(response.body).toHaveProperty("user");
			expect(response.body.user.email).toBe(user.email);
			expect(response.body.user).not.toHaveProperty("passwordHash");
		});

		it("should not authenticate unverified email", async () => {
			const user = await createUser({
				email: "unverified@example.com",
				password: "Password123",
				emailVerified: false,
			});

			const response = await request(app)
				.post("/users/authenticate")
				.send({
					email: user.email,
					password: user.password,
				})
				.expect(403);

			expect(response.body.code).toBe("EMAIL_NOT_VERIFIED");
		});

		it("should not authenticate user with invalid email", async () => {
			const response = await request(app)
				.post("/users/authenticate")
				.send({
					email: "nonexistent@example.com",
					password: "password123",
				})
				.expect(400);

			expect(response.body).toHaveProperty("message");
		});

		it("should not authenticate user with invalid password", async () => {
			const user = await createUser({
				email: "john@example.com",
				password: "Password123",
			});

			const response = await request(app)
				.post("/users/authenticate")
				.send({
					email: user.email,
					password: "wrongpassword",
				})
				.expect(400);

			expect(response.body).toHaveProperty("message");
		});

		it("should not authenticate with missing credentials", async () => {
			const response = await request(app)
				.post("/users/authenticate")
				.send({
					email: "john@example.com",
				})
				.expect(400);

			expect(response.body).toHaveProperty("errors");
		});

		it("should authenticate user already linked with googleId", async () => {
			const user = await createUser({
				email: "google.user@example.com",
				password: "Password123",
				googleId: "google-sub-123",
			});

			mockedVerifyGoogleIdToken.mockResolvedValue({
				googleId: "google-sub-123",
				email: user.email,
				emailVerified: true,
			});

			const response = await request(app)
				.post("/users/authenticate")
				.send({
					googleIdToken: "fake-google-id-token",
				})
				.expect(200);

			expect(response.body).toHaveProperty("token");
			expect(response.body.user.email).toBe(user.email);
		});

		it("should link googleId to existing email and authenticate", async () => {
			const user = await createUser({
				email: "link.google@example.com",
				password: "Password123",
			});

			mockedVerifyGoogleIdToken.mockResolvedValue({
				googleId: "google-sub-to-link",
				email: user.email,
				emailVerified: true,
			});

			const response = await request(app)
				.post("/users/authenticate")
				.send({
					googleIdToken: "fake-google-id-token",
				})
				.expect(200);

			expect(response.body).toHaveProperty("token");
			expect(response.body.user.email).toBe(user.email);

			const updated = await prisma.user.findUnique({
				where: { email: user.email },
			});
			expect(updated?.googleId).toBe("google-sub-to-link");
			expect(updated?.emailVerified).toBe(true);
		});

		it("should ask user to register when google email does not exist", async () => {
			mockedVerifyGoogleIdToken.mockResolvedValue({
				googleId: "google-sub-unknown",
				email: "new.google.user@example.com",
				emailVerified: true,
			});

			const response = await request(app)
				.post("/users/authenticate")
				.send({
					googleIdToken: "fake-google-id-token",
				})
				.expect(404);

			expect(response.body.message).toBe("Conta não cadastrada.");
			expect(response.body.code).toBe("REGISTRATION_REQUIRED");
		});

		it("should reject google login when linked account is not verified", async () => {
			const user = await createUser({
				email: "google.unverified@example.com",
				password: "Password123",
				googleId: "google-sub-unverified",
				emailVerified: false,
			});

			mockedVerifyGoogleIdToken.mockResolvedValue({
				googleId: "google-sub-unverified",
				email: user.email,
				emailVerified: true,
			});

			const response = await request(app)
				.post("/users/authenticate")
				.send({
					googleIdToken: "fake-google-id-token",
				})
				.expect(403);

			expect(response.body.code).toBe("EMAIL_NOT_VERIFIED");
		});

		it("should activate unverified account when linking google by email", async () => {
			const user = await createUser({
				email: "activate.via.google@example.com",
				password: "Password123",
				emailVerified: false,
			});

			mockedVerifyGoogleIdToken.mockResolvedValue({
				googleId: "google-sub-activate",
				email: user.email,
				emailVerified: true,
			});

			const response = await request(app)
				.post("/users/authenticate")
				.send({
					googleIdToken: "fake-google-id-token",
				})
				.expect(200);

			expect(response.body).toHaveProperty("token");

			const updated = await prisma.user.findUnique({
				where: { email: user.email },
			});
			expect(updated?.googleId).toBe("google-sub-activate");
			expect(updated?.emailVerified).toBe(true);
		});
	});

	describe("email verification and password reset", () => {
		it("should verify email with valid token", async () => {
			const user = await createUser({
				email: "verify.me@example.com",
				password: "Password123",
				emailVerified: false,
			});
			const token = await createEmailToken(user.id, "EMAIL_VERIFICATION");

			await request(app)
				.post("/users/verify-email")
				.send({ token })
				.expect(200);

			const updated = await prisma.user.findUnique({
				where: { id: user.id },
			});
			expect(updated?.emailVerified).toBe(true);
		});

		it("should reject invalid verification token", async () => {
			const response = await request(app)
				.post("/users/verify-email")
				.send({ token: "invalid-token" })
				.expect(400);

			expect(response.body.message).toBe("Invalid or expired token.");
		});

		it("should accept forgot-password for existing user", async () => {
			const user = await createUser({
				email: "forgot@example.com",
				password: "Password123",
			});

			const response = await request(app)
				.post("/users/forgot-password")
				.send({ email: user.email })
				.expect(200);

			expect(response.body.message).toContain("password reset");

			const tokens = await prisma.emailToken.findMany({
				where: { userId: user.id, type: "PASSWORD_RESET" },
			});
			expect(tokens.length).toBe(1);
		});

		it("should reset password with valid token", async () => {
			const user = await createUser({
				email: "reset@example.com",
				password: "Password123",
			});
			const token = await createEmailToken(user.id, "PASSWORD_RESET");

			await request(app)
				.post("/users/reset-password")
				.send({ token, password: "NewPassword1" })
				.expect(200);

			const login = await request(app)
				.post("/users/authenticate")
				.send({
					email: user.email,
					password: "NewPassword1",
				})
				.expect(200);

			expect(login.body).toHaveProperty("token");
		});
	});
});
