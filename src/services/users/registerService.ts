import { env } from "@/env/index";
import { buildVerificationEmail, sendMail } from "@/lib/mailer";
import { verifyGoogleIdToken } from "@/lib/googleAuth";
import { generateRawToken, hashToken } from "@/lib/token";
import type { EmailTokensRepository } from "@/repositories/emailTokensRepository";
import type { UsersRepository } from "@/repositories/usersRepository";
import type { User, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { MasterRequiresEnrollmentError } from "../errors/masterRequiresEnrollmentError";
import { UserAlreadyExistsError } from "../errors/userAlreadyExistsError";

interface RegisterServiceRequest {
	name: string;
	email?: string;
	password?: string;
	googleIdToken?: string;
	enrollment?: string;
	phoneNumber?: string;
	masterConfirm?: boolean;
}

interface RegisterServiceResponse {
	user: User;
	requiresEmailVerification: boolean;
}

export class RegisterService {
	constructor(
		private usersRepository: UsersRepository,
		private emailTokensRepository: EmailTokensRepository,
	) {}

	async execute({
		name,
		email,
		password,
		googleIdToken,
		enrollment,
		phoneNumber,
		masterConfirm,
	}: RegisterServiceRequest): Promise<RegisterServiceResponse> {
		if (masterConfirm === true) {
			if (!enrollment || enrollment.trim() === "") {
				throw new MasterRequiresEnrollmentError();
			}
		}

		const userRole: UserRole = masterConfirm === true ? "MASTER" : "PLAYER";

		if (googleIdToken) {
			const googleIdentity = await verifyGoogleIdToken(googleIdToken);

			const existingByGoogle = await this.usersRepository.findByGoogleId(
				googleIdentity.googleId,
			);
			if (existingByGoogle) {
				throw new UserAlreadyExistsError();
			}

			const existingByEmail = await this.usersRepository.findByEmail(
				googleIdentity.email,
			);
			if (existingByEmail) {
				throw new UserAlreadyExistsError();
			}

			const user = await this.usersRepository.create({
				name: name || googleIdentity.name || googleIdentity.email,
				email: googleIdentity.email,
				passwordHash: null,
				googleId: googleIdentity.googleId,
				emailVerified: true,
				enrollment,
				phoneNumber,
				role: userRole,
			});

			return {
				user,
				requiresEmailVerification: false,
			};
		}

		if (!email || !password) {
			throw new Error("E-mail e senha são obrigatórios");
		}

		const userWithSameEmail = await this.usersRepository.findByEmail(email);
		if (userWithSameEmail) {
			throw new UserAlreadyExistsError();
		}

		const passwordHash = await hash(password, 6);

		const user = await this.usersRepository.create({
			name,
			email,
			passwordHash,
			emailVerified: false,
			enrollment,
			phoneNumber,
			role: userRole,
		});

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
		await sendMail({
			to: user.email,
			...mail,
			devLink: verifyUrl,
		});

		return {
			user,
			requiresEmailVerification: true,
		};
	}
}
