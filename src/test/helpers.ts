import { PrismaClient } from "@prisma/client";
import type {
	EnrollmentStatus,
	SessionPeriod,
	SessionStatus,
	UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function simpleHash(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36);
}

export interface TestUser {
	id: string;
	name: string;
	email: string;
	password: string;
	role: UserRole;
	enrollment?: string;
	phoneNumber?: string;
	googleId?: string;
	emailVerified?: boolean;
}

export interface TestSession {
	id: string;
	title: string;
	description: string;
	system?: string;
	location?: string;
	minPlayers: number;
	maxPlayers: number;
	masterId: string;
	status?: SessionStatus;
	period?: SessionPeriod;
	requirements?: string;
	approvedDate?: Date;
}

export async function createUser(
	data: Partial<TestUser> = {},
): Promise<TestUser> {
	const password = data.password || "TestPassword123!";
	const hashedPassword = await bcrypt.hash(password, 8);

	const stack = new Error().stack || "";
	const testIdentifier = simpleHash(stack);
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	const uniqueId = `${testIdentifier}-${timestamp}-${random}`;

	const userData = {
		name: data.name || "Test User",
		email: data.email || `test-${uniqueId}@example.com`,
		password: password,
		role: data.role || ("PLAYER" as UserRole),
		enrollment: data.enrollment,
		phoneNumber: data.phoneNumber,
		googleId: data.googleId,
		emailVerified: data.emailVerified ?? true,
	};

	try {
		const user = await prisma.user.create({
			data: {
				name: userData.name,
				email: userData.email,
				passwordHash: hashedPassword,
				role: userData.role,
				enrollment: userData.enrollment,
				phoneNumber: userData.phoneNumber,
				googleId: userData.googleId,
				emailVerified: userData.emailVerified,
			},
		});

		return {
			...userData,
			id: user.id,
		};
	} catch (error) {
		console.warn(
			"Error creating user, retrying with even more unique email:",
			error instanceof Error ? error.message : error,
		);

		if (
			error instanceof Error &&
			error.message.includes("Unique constraint failed")
		) {
			const extraRandom = Math.random().toString(36).substring(2, 12);
			const newUniqueId = `${uniqueId}-${extraRandom}-retry`;

			const user = await prisma.user.create({
				data: {
					name: userData.name,
					email: `test-${newUniqueId}@example.com`,
					passwordHash: hashedPassword,
					role: userData.role,
					enrollment: userData.enrollment,
					phoneNumber: userData.phoneNumber,
					googleId: userData.googleId,
					emailVerified: userData.emailVerified,
				},
			});

			return {
				...userData,
				email: `test-${newUniqueId}@example.com`,
				id: user.id,
			};
		}
		throw error;
	}
}

export async function createSession(
	data: Partial<TestSession> & { masterId: string },
): Promise<TestSession> {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + 3);

	const sessionData = {
		title: data.title || "Test Session",
		description: data.description || "Test session description",
		system: data.system || "D&D 5e",
		location: data.location,
		minPlayers: data.minPlayers || 3,
		maxPlayers: data.maxPlayers || 6,
		master: {
			connect: {
				id: data.masterId,
			},
		},
		status: data.status || ("PENDENTE" as SessionStatus),
		period: data.period,
		requirements: data.requirements,
		approvedDate:
			data.approvedDate ||
			(data.status === "APROVADA" ? futureDate : undefined),
	};

	const session = await prisma.session.create({
		data: sessionData,
	});

	return {
		id: session.id,
		title: session.title,
		description: session.description,
		system: session.system || undefined,
		location: session.location || undefined,
		minPlayers: session.minPlayers,
		maxPlayers: session.maxPlayers,
		masterId: data.masterId,
		status: session.status,
		period: session.period || undefined,
		requirements: session.requirements || undefined,
		approvedDate: session.approvedDate || undefined,
	};
}

export async function createWorkshop(
	data: Partial<Omit<TestSession, "masterId">> & { facilitatorIds: string[] },
): Promise<TestSession & { facilitatorIds: string[] }> {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + 3);

	const sessionData = {
		type: "OFICINA" as const,
		title: data.title || "Test Workshop",
		description: data.description || "Test workshop description",
		location: data.location,
		minPlayers: data.minPlayers || 3,
		maxPlayers: data.maxPlayers || 6,
		status: data.status || ("PENDENTE" as SessionStatus),
		period: data.period,
		requirements: data.requirements,
		approvedDate:
			data.approvedDate ||
			(data.status === "APROVADA" ? futureDate : undefined),
	};

	const session = await prisma.session.create({
		data: sessionData,
	});

	for (const userId of data.facilitatorIds) {
		await prisma.sessionFacilitator.create({
			data: { sessionId: session.id, userId },
		});
	}

	return {
		id: session.id,
		title: session.title,
		description: session.description,
		location: session.location || undefined,
		minPlayers: session.minPlayers,
		maxPlayers: session.maxPlayers,
		masterId: "",
		status: session.status,
		period: session.period || undefined,
		requirements: session.requirements || undefined,
		approvedDate: session.approvedDate || undefined,
		facilitatorIds: data.facilitatorIds,
	};
}

export async function createSessionWithDates(
	sessionData: Partial<TestSession> & { masterId: string },
	dates: Date[],
): Promise<TestSession> {
	const session = await createSession(sessionData);

	await prisma.sessionPossibleDate.createMany({
		data: dates.map((date) => ({
			sessionId: session.id,
			date,
		})),
	});

	return session;
}

export async function enrollUserInSession(
	userId: string,
	sessionId: string,
	status: EnrollmentStatus = "PENDENTE" as EnrollmentStatus,
) {
	return await prisma.sessionEnrollment.create({
		data: {
			userId,
			sessionId,
			status,
		},
	});
}

export async function createEmailToken(
	userId: string,
	type: "EMAIL_VERIFICATION" | "PASSWORD_RESET" = "EMAIL_VERIFICATION",
) {
	const { generateRawToken, hashToken } = await import("@/lib/token");
	const rawToken = generateRawToken();
	await prisma.emailToken.create({
		data: {
			userId,
			tokenHash: hashToken(rawToken),
			type,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60),
		},
	});
	return rawToken;
}

export async function cleanupTestData() {
	const maxRetries = 3;
	let retryCount = 0;

	while (retryCount < maxRetries) {
		try {
			await prisma.sessionEnrollment.deleteMany();
			await prisma.sessionFacilitator.deleteMany();
			await prisma.sessionPossibleDate.deleteMany();
			await prisma.session.deleteMany();
			await prisma.emailToken.deleteMany();
			await prisma.user.deleteMany();
			return;
		} catch (error) {
			retryCount++;
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			console.warn(
				`Helper cleanup attempt ${retryCount} failed:`,
				errorMessage,
			);

			if (retryCount >= maxRetries) {
				try {
					await prisma.$executeRaw`TRUNCATE TABLE "SessionEnrollment", "SessionPossibleDate", "Session", "EmailToken", "User" CASCADE`;
					return;
				} catch (truncateError) {
					try {
						await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;
						await prisma.$executeRaw`DELETE FROM "SessionEnrollment"`;
						await prisma.$executeRaw`DELETE FROM "SessionPossibleDate"`;
						await prisma.$executeRaw`DELETE FROM "Session"`;
						await prisma.$executeRaw`DELETE FROM "EmailToken"`;
						await prisma.$executeRaw`DELETE FROM "User"`;
						await prisma.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
						return;
					} catch (finalError) {
						const finalErrorMessage =
							finalError instanceof Error
								? finalError.message
								: "Unknown error";
						console.error(
							"All cleanup methods failed in helpers:",
							finalErrorMessage,
						);
						throw finalError;
					}
				}
			}

			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}
}

export { prisma };
