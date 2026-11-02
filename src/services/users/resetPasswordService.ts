import { hashToken } from "@/lib/token";
import type { EmailTokensRepository } from "@/repositories/emailTokensRepository";
import type { UsersRepository } from "@/repositories/usersRepository";
import { hash } from "bcryptjs";
import { InvalidTokenError } from "../errors/invalidTokenError";

interface ResetPasswordRequest {
	token: string;
	password: string;
}

export class ResetPasswordService {
	constructor(
		private usersRepository: UsersRepository,
		private emailTokensRepository: EmailTokensRepository,
	) {}

	async execute({ token, password }: ResetPasswordRequest): Promise<void> {
		const tokenHash = hashToken(token);
		const emailToken = await this.emailTokensRepository.findValidByTokenHash(
			tokenHash,
			"PASSWORD_RESET",
		);

		if (!emailToken) {
			throw new InvalidTokenError();
		}

		const passwordHash = await hash(password, 6);

		await this.usersRepository.update(emailToken.userId, {
			passwordHash,
			emailVerified: true,
		});
		await this.emailTokensRepository.markUsed(emailToken.id);
		await this.emailTokensRepository.invalidateUserTokens(
			emailToken.userId,
			"PASSWORD_RESET",
		);
	}
}
