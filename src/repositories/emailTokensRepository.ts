import type { EmailToken, EmailTokenType, Prisma } from "@prisma/client";

export interface EmailTokensRepository {
	create(data: Prisma.EmailTokenCreateInput): Promise<EmailToken>;
	findValidByTokenHash(
		tokenHash: string,
		type: EmailTokenType,
	): Promise<EmailToken | null>;
	markUsed(id: string): Promise<EmailToken>;
	invalidateUserTokens(userId: string, type: EmailTokenType): Promise<void>;
}
