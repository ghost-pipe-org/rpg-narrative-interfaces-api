import { verifyGoogleIdToken } from "@/lib/googleAuth";
import type { UsersRepository } from "@/repositories/usersRepository";
import type { User } from "@prisma/client";
import { compare } from "bcryptjs";
import { EmailNotVerifiedError } from "../errors/emailNotVerifiedError";
import { InvalidCredentialsError } from "../errors/invalidCredentialsError";
import { UserRegistrationRequiredError } from "../errors/userRegistrationRequiredError";
import type { ResendVerificationService } from "./resendVerificationService";

interface AuthenticateRequest {
	email?: string;
	password?: string;
	googleIdToken?: string;
}

interface AuthenticateResponse {
	user: User;
}

export class AuthenticateService {
	constructor(
		private userRepository: UsersRepository,
		private resendVerificationService: ResendVerificationService,
	) {}

	async execute({
		email,
		password,
		googleIdToken,
	}: AuthenticateRequest): Promise<AuthenticateResponse> {
		if (googleIdToken) {
			const googleIdentity = await verifyGoogleIdToken(googleIdToken);

			const userByGoogleId = await this.userRepository.findByGoogleId(
				googleIdentity.googleId,
			);

			if (userByGoogleId) {
				if (userByGoogleId.email !== googleIdentity.email) {
					throw new InvalidCredentialsError();
				}

				if (!userByGoogleId.emailVerified) {
					await this.resendVerificationAndReject(userByGoogleId.email);
				}

				return { user: userByGoogleId };
			}

			const userByEmail = await this.userRepository.findByEmail(
				googleIdentity.email,
			);

			if (!userByEmail) {
				throw new UserRegistrationRequiredError();
			}

			if (
				userByEmail.googleId &&
				userByEmail.googleId !== googleIdentity.googleId
			) {
				throw new InvalidCredentialsError();
			}

			// Google proves ownership of the email, so linking also activates the account.
			const user = await this.userRepository.update(userByEmail.id, {
				googleId: googleIdentity.googleId,
				emailVerified: true,
			});

			return { user };
		}

		if (!email || !password) {
			throw new InvalidCredentialsError();
		}

		const user = await this.userRepository.findByEmail(email);

		if (!user || !user.passwordHash) {
			throw new InvalidCredentialsError();
		}

		const doesPasswordMatch = await compare(password, user.passwordHash);

		if (!doesPasswordMatch) {
			throw new InvalidCredentialsError();
		}

		if (!user.emailVerified) {
			await this.resendVerificationAndReject(user.email);
		}

		return {
			user,
		};
	}

	private async resendVerificationAndReject(email: string): Promise<never> {
		await this.resendVerificationService.execute({ email });
		throw new EmailNotVerifiedError();
	}
}
