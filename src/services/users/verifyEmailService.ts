import { hashToken } from "@/lib/token";
import type { EmailTokensRepository } from "@/repositories/emailTokensRepository";
import type { UsersRepository } from "@/repositories/usersRepository";
import { InvalidTokenError } from "../errors/invalidTokenError";

interface VerifyEmailRequest {
	token: string;
}

export class VerifyEmailService {
	constructor(
		private usersRepository: UsersRepository,
		private emailTokensRepository: EmailTokensRepository,
	) {}

	async execute({ token }: VerifyEmailRequest): Promise<void> {
		const tokenHash = hashToken(token);
		const emailToken = await this.emailTokensRepository.findValidByTokenHash(
			tokenHash,
			"EMAIL_VERIFICATION",
		);

		if (!emailToken) {
			throw new InvalidTokenError();
		}

		await this.usersRepository.update(emailToken.userId, {
			emailVerified: true,
		});
		await this.emailTokensRepository.markUsed(emailToken.id);
		await this.emailTokensRepository.invalidateUserTokens(
			emailToken.userId,
			"EMAIL_VERIFICATION",
		);
	}
}
