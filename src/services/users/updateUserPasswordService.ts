import type { UsersRepository } from "@/repositories/usersRepository";
import bcrypt from "bcryptjs";
import { InvalidCredentialsError } from "../errors/invalidCredentialsError";
import { InvalidUserError } from "../errors/invalidUserError";

interface UpdateUserPasswordServiceRequest {
	userId: string;
	currentPasswordRaw: string;
	newPasswordRaw: string;
}

export class UpdateUserPasswordService {
	constructor(private usersRepository: UsersRepository) {}

	async execute({
		userId,
		currentPasswordRaw,
		newPasswordRaw,
	}: UpdateUserPasswordServiceRequest): Promise<void> {
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

		const newPasswordHash = await bcrypt.hash(newPasswordRaw, 6);

		await this.usersRepository.update(userId, {
			passwordHash: newPasswordHash,
		});
	}
}
