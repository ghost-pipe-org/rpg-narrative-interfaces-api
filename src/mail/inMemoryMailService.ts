import type { MailMessage, MailService } from "./mailService";

/** Implementação para testes: guarda as mensagens em vez de enviá-las. */
export class InMemoryMailService implements MailService {
	public sent: MailMessage[] = [];

	async send(message: MailMessage): Promise<void> {
		this.sent.push(message);
	}
}
