import { env } from "@/env/index";
import {
	buildPasswordResetEmail,
	isDevMailFallbackEnabled,
	sendMail,
} from "@/lib/mailer";
import { generateRawToken, hashToken } from "@/lib/token";
import type { EmailTokensRepository } from "@/repositories/emailTokensRepository";
import type { UsersRepository } from "@/repositories/usersRepository";

interface ForgotPasswordRequest {
	email: string;
}

interface ForgotPasswordResponse {
	devLink?: string;
}

export class ForgotPasswordService {
	constructor(
		private usersRepository: UsersRepository,
		private emailTokensRepository: EmailTokensRepository,
	) {}

	async execute({ email }: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
		const user = await this.usersRepository.findByEmail(email);

		if (!user || !user.passwordHash) {
			return {};
		}

		await this.emailTokensRepository.invalidateUserTokens(
			user.id,
			"PASSWORD_RESET",
		);

		const rawToken = generateRawToken();
		const tokenHash = hashToken(rawToken);
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

		await this.emailTokensRepository.create({
			tokenHash,
			type: "PASSWORD_RESET",
			expiresAt,
			user: { connect: { id: user.id } },
		});

		const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
		const mail = buildPasswordResetEmail(user.name, resetUrl);
		const { sent } = await sendMail({
			to: user.email,
			...mail,
			devLink: resetUrl,
		});

		return {
			devLink: !sent && isDevMailFallbackEnabled() ? resetUrl : undefined,
		};
	}
}
