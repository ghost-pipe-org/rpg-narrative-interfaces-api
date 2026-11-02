import { prisma } from "@/lib/prisma";
import type { EventType, Prisma, SessionStatus } from "@prisma/client";
import type { SessionsRepository } from "../sessionsRepository";

const facilitatorsInclude = {
	facilitators: {
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	},
} as const;

export class PrismaSessionsRepository implements SessionsRepository {
	async findById(id: string) {
		return prisma.session.findUnique({
			where: { id },
			include: {
				master: {
					select: {
						name: true,
					},
				},
				possibleDates: true,
				enrollments: true,
				...facilitatorsInclude,
			},
		});
	}

	async create(data: Prisma.SessionCreateInput) {
		return prisma.session.create({
			data,
		});
	}

	async update(id: string, data: Prisma.SessionUpdateInput) {
		return prisma.session.update({
			where: { id },
			data,
		});
	}

	async delete(id: string) {
		await prisma.session.delete({
			where: { id },
		});
	}

	async getAll() {
		return prisma.session.findMany({
			include: {
				master: {
					select: {
						name: true,
					},
				},
				possibleDates: true,
				...facilitatorsInclude,
			},
		});
	}

	async getAllByType(type: EventType) {
		return prisma.session.findMany({
			where: { type },
			include: {
				master: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				possibleDates: true,
				...facilitatorsInclude,
			},
		});
	}

	async getByUserId(userId: string) {
		return prisma.session.findMany({
			where: {
				enrollments: {
					some: {
						userId: userId,
					},
				},
			},
			include: {
				master: {
					select: {
						name: true,
					},
				},
				...facilitatorsInclude,
			},
		});
	}

	async getAllByStatus(status: string) {
		return prisma.session.findMany({
			where: { status: status as SessionStatus },
			include: {
				master: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				possibleDates: true,
				enrollments: true,
				...facilitatorsInclude,
			},
		});
	}

	async getAllByStatusAndType(status: string, type: EventType) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		return prisma.session.findMany({
			where: {
				status: status as SessionStatus,
				type,
				approvedDate: {
					gte: today,
				},
			},
			include: {
				master: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				possibleDates: true,
				enrollments: true,
				...facilitatorsInclude,
			},
		});
	}

	async subscribeUserToSession(sessionId: string, userId: string) {
		return prisma.sessionEnrollment.create({
			data: {
				sessionId,
				userId,
				status: "PENDENTE",
			},
		});
	}

	async unsubscribeUserFromSession(sessionId: string, userId: string) {
		await prisma.sessionEnrollment.delete({
			where: {
				userId_sessionId: {
					userId,
					sessionId,
				},
			},
		});
	}

	async isUserEnrolled(sessionId: string, userId: string) {
		const enrollment = await prisma.sessionEnrollment.findFirst({
			where: {
				sessionId,
				userId,
			},
		});
		return !!enrollment;
	}

	async findFirstByMasterAndStatusAndType(
		masterId: string,
		status: string,
		type: EventType,
	) {
		return prisma.session.findFirst({
			where: {
				masterId,
				status: status as SessionStatus,
				type,
			},
		});
	}

	async findFirstByFacilitatorAndStatusAndType(
		userId: string,
		status: string,
		type: EventType,
	) {
		const result = await prisma.sessionFacilitator.findFirst({
			where: {
				userId,
				session: {
					status: status as SessionStatus,
					type,
				},
			},
		});
		return result
			? prisma.session.findUnique({ where: { id: result.sessionId } })
			: null;
	}

	async findEmittedByMaster(masterId: string) {
		return prisma.session.findMany({
			where: {
				masterId,
				type: "MESA",
			},
			include: {
				enrollments: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								phoneNumber: true,
							},
						},
					},
				},
				...facilitatorsInclude,
			},
		});
	}

	async findEmittedByFacilitator(userId: string) {
		const facilitatorEntries = await prisma.sessionFacilitator.findMany({
			where: { userId },
			select: { sessionId: true },
		});

		return prisma.session.findMany({
			where: {
				id: { in: facilitatorEntries.map((f) => f.sessionId) },
			},
			include: {
				enrollments: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								phoneNumber: true,
							},
						},
					},
				},
				...facilitatorsInclude,
			},
		});
	}

	async findEnrolledByUser(userId: string) {
		return prisma.sessionEnrollment.findMany({
			where: {
				userId,
			},
			include: {
				session: {
					include: {
						master: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
						possibleDates: true,
						enrollments: true,
						...facilitatorsInclude,
					},
				},
			},
		});
	}

	async addFacilitator(sessionId: string, userId: string) {
		await prisma.sessionFacilitator.create({
			data: {
				sessionId,
				userId,
			},
		});
	}
}
