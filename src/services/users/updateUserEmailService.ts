import { env } from "@/env/index";
import { generateRawToken, hashToken } from "@/lib/token";
import type { MailService } from "@/mail/mailService";
import { buildEmailChangeEmail } from "@/mail/templates";
import type { EmailTokensRepository } from "@/repositories/emailTokensRepository";
import type { UsersRepository } from "@/repositories/usersRepository";
import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { InvalidCredentialsError } from "../errors/invalidCredentialsError";
import { InvalidUserError } from "../errors/invalidUserError";
import { UserAlreadyExistsError } from "../errors/userAlreadyExistsError";

interface UpdateUserEmailServiceRequest {
	userId: string;
	currentPasswordRaw: string;
	newEmail: string;
}

interface UpdateUserEmailServiceResponse {
	user: Omit<User, "passwordHash">;
	pendingConfirmation: boolean;
}

export class UpdateUserEmailService {
	constructor(
		private usersRepository: UsersRepository,
		private emailTokensRepository: EmailTokensRepository,
		private mailService: MailService,
	) {}

	async execute({
		userId,
		currentPasswordRaw,
		newEmail,
	}: UpdateUserEmailServiceRequest): Promise<UpdateUserEmailServiceResponse> {
		const existingUser = await this.usersRepository.findById(userId);

		if (!existingUser || !existingUser.passwordHash) {
			throw new InvalidUserError();
		}

		const isPasswordValid = await bcrypt.compare(
			currentPasswordRaw,
			existingUser.passwordHash,
		);

		if (!isPasswordValid) {
			throw new InvalidCredentialsError();
		}

		const normalizedEmail = newEmail.trim();
		const { passwordHash, ...safeUserData } = existingUser;

		if (existingUser.email === normalizedEmail) {
			return {
				user: safeUserData,
				pendingConfirmation: false,
			};
		}

		const emailInUse = await this.usersRepository.findByEmail(normalizedEmail);
		if (emailInUse) {
			throw new UserAlreadyExistsError();
		}

		await this.emailTokensRepository.invalidateUserTokens(
			userId,
			"EMAIL_CHANGE",
		);

		const rawToken = generateRawToken();
		const tokenHash = hashToken(rawToken);
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

		await this.emailTokensRepository.create({
			tokenHash,
			type: "EMAIL_CHANGE",
			newEmail: normalizedEmail,
			expiresAt,
			user: { connect: { id: userId } },
		});

		const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`;
		const mail = buildEmailChangeEmail(
			existingUser.name,
			normalizedEmail,
			verifyUrl,
		);
		await this.mailService.send({ to: normalizedEmail, ...mail });

		return {
			user: safeUserData,
			pendingConfirmation: true,
		};
	}
}
