import { env } from "@/env/index";
import { generateRawToken, hashToken } from "@/lib/token";
import type { MailService } from "@/mail/mailService";
import { buildPasswordResetEmail } from "@/mail/templates";
import type { EmailTokensRepository } from "@/repositories/emailTokensRepository";
import type { UsersRepository } from "@/repositories/usersRepository";

interface ForgotPasswordRequest {
	email: string;
}

export class ForgotPasswordService {
	constructor(
		private usersRepository: UsersRepository,
		private emailTokensRepository: EmailTokensRepository,
		private mailService: MailService,
	) {}

	async execute({ email }: ForgotPasswordRequest): Promise<void> {
		const user = await this.usersRepository.findByEmail(email);

		if (!user || !user.passwordHash) {
			return;
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
		await this.mailService.send({ to: user.email, ...mail });
	}
}
