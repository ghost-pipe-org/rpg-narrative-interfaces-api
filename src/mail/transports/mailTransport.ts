import type { MailMessage } from "../mailService";

/**
 * Entrega efetiva de uma mensagem (SMTP, API HTTP...).
 * Deve lançar erro em caso de falha, para que a fila possa tentar de novo.
 */
export interface MailTransport {
	deliver(message: MailMessage): Promise<void>;
}
