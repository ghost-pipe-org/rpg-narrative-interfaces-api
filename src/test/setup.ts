import { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
		},
	},
});

async function cleanDatabase() {
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

			console.log("Database cleaned successfully");
			return;
		} catch (error) {
			retryCount++;
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			console.warn(`Cleanup attempt ${retryCount} failed:`, errorMessage);

			if (retryCount >= maxRetries) {
				console.warn("All cleanup attempts failed, trying to truncate tables");

				try {
					await prisma.$executeRaw`TRUNCATE TABLE "SessionEnrollment", "SessionPossibleDate", "Session", "EmailToken", "User" CASCADE`;
					console.log("Database truncated successfully");
					return;
				} catch (truncateError) {
					console.error(
						"Truncate also failed, database may be in inconsistent state",
					);
					try {
						await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;
						await prisma.$executeRaw`DELETE FROM "SessionEnrollment"`;
						await prisma.$executeRaw`DELETE FROM "SessionPossibleDate"`;
						await prisma.$executeRaw`DELETE FROM "Session"`;
						await prisma.$executeRaw`DELETE FROM "User"`;
						await prisma.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
						console.log("Database cleaned with deferred constraints");
						return;
					} catch (finalError) {
						const finalErrorMessage =
							finalError instanceof Error
								? finalError.message
								: "Unknown error";
						console.error("All cleanup methods failed:", finalErrorMessage);
						throw finalError;
					}
				}
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}
}

beforeAll(async () => {
	await prisma.$connect();
	console.log("Starting initial database cleanup...");
	await cleanDatabase();
});

afterAll(async () => {
	console.log("Starting final database cleanup...");
	await cleanDatabase();

	await prisma.$disconnect();
});

afterEach(async () => {
	try {
		const userCount = await prisma.user.count();
		if (userCount > 10) {
			console.log(`Too many users (${userCount}), cleaning database...`);
			await cleanDatabase();
		}
	} catch (error) {
		console.warn("Could not check user count, skipping conditional cleanup");
	}
});

export { prisma };
