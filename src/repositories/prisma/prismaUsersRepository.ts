import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { UsersRepository } from "../usersRepository";

export class PrismaUsersRepository implements UsersRepository {
	async findByEmail(email: string) {
		const user = await prisma.user.findUnique({
			where: { email },
		});
		return user;
	}
	async findByGoogleId(googleId: string) {
		const user = await prisma.user.findUnique({
			where: { googleId },
		});
		return user;
	}
	async create(data: Prisma.UserCreateInput) {
		const user = await prisma.user.create({
			data,
		});
		return user;
	}
	async findById(id: string) {
		const user = await prisma.user.findUnique({
			where: { id },
		});
		return user;
	}
	async update(id: string, data: Prisma.UserUpdateInput) {
		const user = await prisma.user.update({
			where: { id },
			data: {
				...data,
				updatedAt: new Date(),
			},
		});
		return user;
	}
}
