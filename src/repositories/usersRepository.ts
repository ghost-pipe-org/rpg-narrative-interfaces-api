import type { Prisma, User } from "@prisma/client";

export interface UsersRepository {
	findByEmail(email: string): Promise<User | null>;
	findByGoogleId(googleId: string): Promise<User | null>;
	create(data: Prisma.UserCreateInput): Promise<User>;
	findById(id: string): Promise<User | null>;
	update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
}
