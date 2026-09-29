import type { SessionsRepository } from "@/repositories/sessionsRepository";
import type { UsersRepository } from "@/repositories/usersRepository";
import { EnrollmentCancellationWindowError } from "../errors/enrollmentCancellationWindowError";
import { InvalidSessionError } from "../errors/invalidSessionError";
import { InvalidUserError } from "../errors/invalidUserError";
import { NotEnrolledError } from "../errors/notEnrolledError";

interface CancelEnrollmentServiceRequest {
	sessionId: string;
	userId: string;
}

interface CancelEnrollmentServiceResponse {
	success: boolean;
	message: string;
}

export class CancelEnrollmentService {
	constructor(
		private sessionsRepository: SessionsRepository,
		private usersRepository: UsersRepository,
	) {}

	async execute({
		sessionId,
		userId,
	}: CancelEnrollmentServiceRequest): Promise<CancelEnrollmentServiceResponse> {
		const session = await this.sessionsRepository.findById(sessionId);

		if (!session) {
			throw new InvalidSessionError();
		}

		const user = await this.usersRepository.findById(userId);

		if (!user) {
			throw new InvalidUserError();
		}

		const isEnrolled = await this.sessionsRepository.isUserEnrolled(
			sessionId,
			userId,
		);
		if (!isEnrolled) {
			throw new NotEnrolledError();
		}

		if (session.approvedDate) {
			const now = new Date();
			const sessionDate = new Date(session.approvedDate);
			const diffMs = sessionDate.getTime() - now.getTime();
			const diffHours = diffMs / (1000 * 60 * 60);
			if (diffHours < 24) {
				throw new EnrollmentCancellationWindowError();
			}
		}

		await this.sessionsRepository.unsubscribeUserFromSession(sessionId, userId);

		return {
			success: true,
			message: "Inscrição na sessão cancelada com sucesso.",
		};
	}
}
