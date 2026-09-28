import { randomUUID } from "node:crypto";
import type { Prisma, User } from "@prisma/client";
import type { UsersRepository } from "../usersRepository";

export class InMemoryUsersRepository implements UsersRepository {
	public items: User[] = [];

	async findByEmail(email: string) {
		const user = this.items.find((user) => user.email === email);
		return user || null;
	}

	async findByGoogleId(googleId: string) {
		const user = this.items.find((user) => user.googleId === googleId);
		return user || null;
	}

	async findById(id: string) {
		const user = this.items.find((user) => user.id === id);
		return user || null;
	}

	async create(data: Prisma.UserCreateInput) {
		const user: User = {
			id: randomUUID(),
			name: data.name,
			email: data.email,
			passwordHash:
				typeof data.passwordHash === "string" ? data.passwordHash : null,
			googleId: typeof data.googleId === "string" ? data.googleId : null,
			emailVerified: data.emailVerified ?? false,
			role: data.role ?? "PLAYER",
			enrollment:
				typeof data.enrollment === "string" ? data.enrollment : null,
			phoneNumber:
				typeof data.phoneNumber === "string" ? data.phoneNumber : null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.items.push(user);
		return user;
	}

	async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
		const userIndex = this.items.findIndex((user) => user.id === id);
		if (userIndex === -1) {
			throw new Error(`User with id ${id} not found`);
		}

		const currentUser = this.items[userIndex];
		const updatedUser: User = {
			...currentUser,
			name: typeof data.name === "string" ? data.name : currentUser.name,
			email: typeof data.email === "string" ? data.email : currentUser.email,
			passwordHash:
				typeof data.passwordHash === "string"
					? data.passwordHash
					: data.passwordHash === null
						? null
						: currentUser.passwordHash,
			googleId:
				typeof data.googleId === "string"
					? data.googleId
					: data.googleId === null
						? null
						: currentUser.googleId,
			emailVerified:
				typeof data.emailVerified === "boolean"
					? data.emailVerified
					: currentUser.emailVerified,
			role: typeof data.role === "string" ? data.role : currentUser.role,
			enrollment:
				typeof data.enrollment === "string"
					? data.enrollment
					: data.enrollment === null
						? null
						: currentUser.enrollment,
			phoneNumber:
				typeof data.phoneNumber === "string"
					? data.phoneNumber
					: data.phoneNumber === null
						? null
						: currentUser.phoneNumber,
			updatedAt: new Date(),
		};

		this.items[userIndex] = updatedUser;
		return updatedUser;
	}
}
