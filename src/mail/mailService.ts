export interface MailMessage {
	to: string;
	subject: string;
	text: string;
	html: string;
}

/**
 * Porta de envio de e-mails usada pela camada de serviços.
 * Não conhece transporte (SMTP, API) nem fila: quem implementa decide como entregar.
 */
export interface MailService {
	send(message: MailMessage): Promise<void>;
}
