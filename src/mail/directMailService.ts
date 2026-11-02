import type { MailMessage, MailService } from "./mailService";
import type { MailTransport } from "./transports/mailTransport";

/**
 * Fallback sem fila (ex.: dev sem Redis): dispara o envio sem bloquear a requisição.
 * Não tem retry nem persistência; em produção use a fila.
 */
export class DirectMailService implements MailService {
	constructor(private transport: MailTransport) {}

	async send(message: MailMessage): Promise<void> {
		this.transport.deliver(message).catch((error) => {
			console.error("[mail] Falha ao enviar e-mail:", error);
		});
	}
}
