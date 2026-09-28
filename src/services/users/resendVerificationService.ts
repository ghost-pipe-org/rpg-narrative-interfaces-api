import { env } from "@/env/index";
import {
	buildVerificationEmail,
	isDevMailFallbackEnabled,
	sendMail,
} from "@/lib/mailer";
import { generateRawToken, hashToken } from "@/lib/token";
import type { EmailTokensRepository } from "@/repositories/emailTokensRepository";
import type { UsersRepository } from "@/repositories/usersRepository";

interface ResendVerificationRequest {
	email: string;
}

interface ResendVerificationResponse {
	devLink?: string;
}

export class ResendVerificationService {
	constructor(
		private usersRepository: UsersRepository,
		private emailTokensRepository: EmailTokensRepository,
	) {}

	async execute({
		email,
	}: ResendVerificationRequest): Promise<ResendVerificationResponse> {
		const user = await this.usersRepository.findByEmail(email);

		if (!user || user.emailVerified || !user.passwordHash) {
			return {};
		}

		await this.emailTokensRepository.invalidateUserTokens(
			user.id,
			"EMAIL_VERIFICATION",
		);

		const rawToken = generateRawToken();
		const tokenHash = hashToken(rawToken);
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

		await this.emailTokensRepository.create({
			tokenHash,
			type: "EMAIL_VERIFICATION",
			expiresAt,
			user: { connect: { id: user.id } },
		});

		const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`;
		const mail = buildVerificationEmail(user.name, verifyUrl);
		const { sent } = await sendMail({
			to: user.email,
			...mail,
			devLink: verifyUrl,
		});

		return {
			devLink: !sent && isDevMailFallbackEnabled() ? verifyUrl : undefined,
		};
	}
}
