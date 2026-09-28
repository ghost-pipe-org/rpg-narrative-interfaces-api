import { env } from "@/env/index";
import nodemailer from "nodemailer";

export interface SendMailInput {
	to: string;
	subject: string;
	text: string;
	html: string;
	/** Link útil em dev quando e-mail não está configurado */
	devLink?: string;
}

export interface SendMailResult {
	sent: boolean;
}

function isGmailConfigured() {
	return Boolean(env.GMAIL_USER && env.GMAIL_APP_PASSWORD);
}

export function isDevMailFallbackEnabled() {
	return env.NODE_ENV === "dev" || env.NODE_ENV === "test";
}

export async function sendMail({
	to,
	subject,
	text,
	html,
	devLink,
}: SendMailInput): Promise<SendMailResult> {
	if (env.NODE_ENV === "test") {
		return { sent: false };
	}

	if (!isGmailConfigured()) {
		console.warn(
			`[mailer] GMAIL_USER/GMAIL_APP_PASSWORD not configured. Skipping email to ${to}: ${subject}`,
		);
		if (devLink) {
			console.warn(`[mailer] Dev link: ${devLink}`);
		}
		return { sent: false };
	}

	try {
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: env.GMAIL_USER,
				pass: env.GMAIL_APP_PASSWORD,
			},
		});

		const from =
			env.GMAIL_FROM ||
			`Interfaces Narrativas <${env.GMAIL_USER}>`;

		await transporter.sendMail({
			from,
			to,
			subject,
			text,
			html,
		});

		return { sent: true };
	} catch (error) {
		console.error("[mailer] Failed to send email:", error);
		if (devLink && isDevMailFallbackEnabled()) {
			console.warn(`[mailer] Dev link fallback: ${devLink}`);
		}
		return { sent: false };
	}
}

export function buildVerificationEmail(name: string, verifyUrl: string) {
	const subject = "Confirme seu e-mail";
	const text = `Olá, ${name}!\n\nConfirme seu e-mail acessando: ${verifyUrl}\n\nSe você não criou esta conta, ignore este e-mail.`;
	const html = `
		<p>Olá, <strong>${name}</strong>!</p>
		<p>Confirme seu e-mail clicando no link abaixo:</p>
		<p><a href="${verifyUrl}">${verifyUrl}</a></p>
		<p>Se você não criou esta conta, ignore este e-mail.</p>
	`;
	return { subject, text, html };
}

export function buildPasswordResetEmail(name: string, resetUrl: string) {
	const subject = "Redefinição de senha";
	const text = `Olá, ${name}!\n\nRedefina sua senha acessando: ${resetUrl}\n\nSe você não solicitou isso, ignore este e-mail.`;
	const html = `
		<p>Olá, <strong>${name}</strong>!</p>
		<p>Redefina sua senha clicando no link abaixo:</p>
		<p><a href="${resetUrl}">${resetUrl}</a></p>
		<p>Se você não solicitou isso, ignore este e-mail.</p>
	`;
	return { subject, text, html };
}
