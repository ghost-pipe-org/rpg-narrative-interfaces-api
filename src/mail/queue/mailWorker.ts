import { Worker } from "bullmq";
import type { MailMessage } from "../mailService";
import type { MailTransport } from "../transports/mailTransport";
import { MAIL_QUEUE_NAME, createRedisConnection } from "./mailQueue";

/** Consumidor: entrega os e-mails da fila usando o transporte informado. */
export function startMailWorker(transport: MailTransport) {
	const worker = new Worker<MailMessage>(
		MAIL_QUEUE_NAME,
		async (job) => {
			await transport.deliver(job.data);
		},
		{ connection: createRedisConnection(), concurrency: 5 },
	);

	worker.on("failed", (job, error) => {
		console.error(
			`[mail] Falha no job ${job?.id} (tentativa ${job?.attemptsMade}):`,
			error.message,
		);
	});

	worker.on("error", (error) => {
		console.error("[mail] Erro no worker:", error.message);
	});

	return worker;
}
