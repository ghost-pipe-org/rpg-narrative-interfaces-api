import { env } from "@/env/index";
import nodemailer, { type Transporter } from "nodemailer";
import type { MailMessage } from "../mailService";
import type { MailTransport } from "./mailTransport";

export class NodemailerTransport implements MailTransport {
	private transporter: Transporter | null = null;

	private isConfigured() {
		return Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
	}

	private getTransporter() {
		if (!this.transporter) {
			this.transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: env.GMAIL_USER,
					pass: env.GMAIL_APP_PASSWORD,
				},
			});
		}
		return this.transporter;
	}

	async deliver(message: MailMessage): Promise<void> {
		if (!this.isConfigured()) {
			// Sem SMTP configurado (ex.: dev local): apenas loga, o conteúdo traz o link.
			console.warn(
				`[mail] GMAIL_USER/GMAIL_APP_PASSWORD não configurados. E-mail não enviado para ${message.to}: ${message.subject}\n${message.text}`,
			);
			return;
		}

		await this.getTransporter().sendMail({
			from: env.GMAIL_FROM || `Interfaces Narrativas <${env.GMAIL_USER}>`,
			to: message.to,
			subject: message.subject,
			text: message.text,
			html: message.html,
		});
	}
}
