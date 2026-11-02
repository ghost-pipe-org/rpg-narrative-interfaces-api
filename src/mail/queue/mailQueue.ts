import { env } from "@/env/index";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { MailMessage, MailService } from "../mailService";

export const MAIL_QUEUE_NAME = "mail";

/**
 * Worker: BullMQ exige maxRetriesPerRequest = null (aguarda o Redis voltar).
 * Produtor: falha rápido (sem fila offline) para não travar a requisição HTTP.
 */
export function createRedisConnection(role: "producer" | "worker" = "worker") {
	if (!env.REDIS_URL) {
		throw new Error("REDIS_URL não configurada.");
	}
	const connection =
		role === "worker"
			? new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })
			: new IORedis(env.REDIS_URL, {
					enableOfflineQueue: false,
					maxRetriesPerRequest: 1,
				});

	connection.on("error", (error) => {
		console.error(`[mail] Erro na conexão Redis (${role}):`, error.message);
	});

	return connection;
}

/** Produtor: apenas enfileira o e-mail e retorna imediatamente. */
export class QueueMailService implements MailService {
	private queue: Queue<MailMessage>;

	constructor() {
		this.queue = new Queue<MailMessage>(MAIL_QUEUE_NAME, {
			connection: createRedisConnection("producer"),
			defaultJobOptions: {
				attempts: 5,
				backoff: { type: "exponential", delay: 5000 },
				removeOnComplete: true,
				removeOnFail: 1000,
			},
		});
		this.queue.on("error", (error) => {
			console.error("[mail] Erro na fila:", error.message);
		});
	}

	async send(message: MailMessage): Promise<void> {
		try {
			await this.queue.add("send-mail", message);
		} catch (error) {
			// Não derruba a requisição (o usuário já foi criado); o reenvio de verificação cobre o caso.
			console.error("[mail] Falha ao enfileirar e-mail:", error);
		}
	}
}
