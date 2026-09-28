import { env } from "@/env/index";
import { Resend } from "resend";

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

function isResendConfigured() {
	return Boolean(env.RESEND_API_KEY);
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

	if (!isResendConfigured()) {
		console.warn(
			`[mailer] RESEND_API_KEY not configured. Skipping email to ${to}: ${subject}`,
		);
		if (devLink) {
			console.warn(`[mailer] Dev link: ${devLink}`);
		}
		return { sent: false };
	}

	try {
		const resend = new Resend(env.RESEND_API_KEY);
		const from =
			env.RESEND_FROM || "Narrativas Interativas <onboarding@resend.dev>";

		const { error } = await resend.emails.send({
			from,
			to: [to],
			subject,
			text,
			html,
		});

		if (error) {
			throw new Error(error.message);
		}

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
