import type { UsersRepository } from "@/repositories/usersRepository";
import type { Prisma, User } from "@prisma/client";
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
}

export class UpdateUserEmailService {
	constructor(private usersRepository: UsersRepository) {}

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

		if (existingUser.email !== newEmail) {
			const emailInUse = await this.usersRepository.findByEmail(newEmail);
			if (emailInUse) {
				throw new UserAlreadyExistsError();
			}
		}

		const updatedUser = await this.usersRepository.update(userId, {
			email: newEmail.trim(),
		});

		const { passwordHash, ...safeUserData } = updatedUser;

		return {
			user: safeUserData,
		};
	}
}
