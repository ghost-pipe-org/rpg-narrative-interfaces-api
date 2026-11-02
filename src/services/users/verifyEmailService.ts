import { hashToken } from "@/lib/token";
import type { EmailTokensRepository } from "@/repositories/emailTokensRepository";
import type { UsersRepository } from "@/repositories/usersRepository";
import { InvalidTokenError } from "../errors/invalidTokenError";
import { UserAlreadyExistsError } from "../errors/userAlreadyExistsError";

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
			["EMAIL_VERIFICATION", "EMAIL_CHANGE"],
		);

		if (!emailToken) {
			throw new InvalidTokenError();
		}

		if (emailToken.type === "EMAIL_CHANGE") {
			if (!emailToken.newEmail) {
				throw new InvalidTokenError();
			}

			const existingWithNewEmail = await this.usersRepository.findByEmail(
				emailToken.newEmail,
			);
			if (
				existingWithNewEmail &&
				existingWithNewEmail.id !== emailToken.userId
			) {
				throw new UserAlreadyExistsError();
			}

			const currentUser = await this.usersRepository.findById(
				emailToken.userId,
			);
			if (!currentUser) {
				throw new InvalidTokenError();
			}

			await this.usersRepository.update(emailToken.userId, {
				email: emailToken.newEmail,
				emailVerified: true,
				...(currentUser.email !== emailToken.newEmail
					? { googleId: null }
					: {}),
			});
			await this.emailTokensRepository.markUsed(emailToken.id);
			await this.emailTokensRepository.invalidateUserTokens(
				emailToken.userId,
				"EMAIL_CHANGE",
			);
			return;
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
