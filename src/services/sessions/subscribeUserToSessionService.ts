import type { SessionsRepository } from "@/repositories/sessionsRepository";
import type { UsersRepository } from "@/repositories/usersRepository";
import { AlreadyEnrolledError } from "../errors/alreadyEnrolledError";
import { EnrollmentClosedError } from "../errors/enrollmentClosedError";
import { InvalidSessionError } from "../errors/invalidSessionError";
import { InvalidUserError } from "../errors/invalidUserError";
import { SessionConflictError } from "../errors/sessionConflictError";
import { SessionFullError } from "../errors/sessionFullError";

interface subscribeUserToSessionServiceRequest {
	sessionId: string;
	userId: string;
}

interface subscribeUserToSessionServiceResponse {
	success: boolean;
	message: string;
}

export class SubscribeUserToSessionService {
	constructor(
		private sessionsRepository: SessionsRepository,
		private usersRepository: UsersRepository,
	) {}

	async execute({
		sessionId,
		userId,
	}: subscribeUserToSessionServiceRequest): Promise<subscribeUserToSessionServiceResponse> {
		const session = await this.sessionsRepository.findById(sessionId);

		if (!session) {
			throw new InvalidSessionError();
		}

		if (session.status !== "APROVADA") {
			throw new EnrollmentClosedError();
		}

		if (session.approvedDate) {
			const now = new Date();
			now.setUTCHours(0, 0, 0, 0);

			const sessionDate = new Date(session.approvedDate);
			sessionDate.setUTCHours(0, 0, 0, 0);

			// Se a data atual for estritamente maior a data da sessão, as inscrições estão fechadas
			if (now > sessionDate) {
				throw new EnrollmentClosedError();
			}
		}

		const user = await this.usersRepository.findById(userId);

		if (!user) {
			throw new InvalidUserError();
		}

		const userEnrollments =
			await this.sessionsRepository.findEnrolledByUser(userId);
		const hasConflict = userEnrollments.some(({ session: enrolledSession }) => {
			if (!enrolledSession.approvedDate || !session.approvedDate) return false;

			const sameDay =
				new Date(enrolledSession.approvedDate).toISOString().slice(0, 10) ===
				new Date(session.approvedDate).toISOString().slice(0, 10);

			if (!sameDay) return false;

			// Regra 1: Apenas uma mesa por dia. Se as duas forem mesas no mesmo dia, conflito imediato.
			if (session.type === "MESA" && enrolledSession.type === "MESA")
				return true;

			// Regra 2: Para qualquer tipo de evento (Mesa ou Oficina), não pode ser no mesmo período.
			return enrolledSession.period === session.period;
		});
		if (hasConflict) {
			throw new SessionConflictError();
		}

		const alreadyEnrolled = await this.sessionsRepository.isUserEnrolled(
			sessionId,
			userId,
		);
		if (alreadyEnrolled) {
			throw new AlreadyEnrolledError();
		}

		const currentEnrollments = session.enrollments.length;
		if (currentEnrollments >= session.maxPlayers) {
			throw new SessionFullError();
		}

		await this.sessionsRepository.subscribeUserToSession(sessionId, userId);

		return {
			success: true,
			message: "Usuário inscrito na sessão com sucesso.",
		};
	}
}
