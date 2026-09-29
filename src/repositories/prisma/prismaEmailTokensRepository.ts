import { prisma } from "@/lib/prisma";
import type { EmailTokenType, Prisma } from "@prisma/client";
import type { EmailTokensRepository } from "../emailTokensRepository";

export class PrismaEmailTokensRepository implements EmailTokensRepository {
	async create(data: Prisma.EmailTokenCreateInput) {
		return prisma.emailToken.create({ data });
	}

	async findValidByTokenHash(tokenHash: string, type: EmailTokenType) {
		return prisma.emailToken.findFirst({
			where: {
				tokenHash,
				type,
				usedAt: null,
				expiresAt: { gt: new Date() },
			},
		});
	}

	async markUsed(id: string) {
		return prisma.emailToken.update({
			where: { id },
			data: { usedAt: new Date() },
		});
	}

	async invalidateUserTokens(userId: string, type: EmailTokenType) {
		await prisma.emailToken.updateMany({
			where: {
				userId,
				type,
				usedAt: null,
			},
			data: {
				usedAt: new Date(),
			},
		});
	}
}
