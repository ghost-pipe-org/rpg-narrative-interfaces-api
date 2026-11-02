import { env } from "@/env/index";
import { DirectMailService } from "@/mail/directMailService";
import { InMemoryMailService } from "@/mail/inMemoryMailService";
import type { MailService } from "@/mail/mailService";
import { QueueMailService } from "@/mail/queue/mailQueue";
import { NodemailerTransport } from "@/mail/transports/nodemailerTransport";

let instance: MailService | null = null;

/** Retorna sempre a mesma instância (uma conexão com o Redis por processo). */
export function makeMailService(): MailService {
	if (instance) return instance;

	if (env.NODE_ENV === "test") {
		instance = new InMemoryMailService();
	} else if (env.REDIS_URL) {
		instance = new QueueMailService();
	} else {
		console.warn(
			"[mail] REDIS_URL não configurada: e-mails serão enviados sem fila (sem retry).",
		);
		instance = new DirectMailService(new NodemailerTransport());
	}

	return instance;
}
