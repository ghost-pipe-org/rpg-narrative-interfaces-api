import type { MailMessage } from "./mailService";

type MailContent = Omit<MailMessage, "to">;

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function buildVerificationEmail(
	name: string,
	verifyUrl: string,
): MailContent {
	const safeName = escapeHtml(name);
	const safeUrl = escapeHtml(verifyUrl);

	return {
		subject: "Confirme seu e-mail",
		text: `Olá, ${name}!\n\nConfirme seu e-mail acessando: ${verifyUrl}\n\nSe você não criou esta conta, ignore este e-mail.`,
		html: `
		<p>Olá, <strong>${safeName}</strong>!</p>
		<p>Confirme seu e-mail clicando no link abaixo:</p>
		<p><a href="${safeUrl}">${safeUrl}</a></p>
		<p>Se você não criou esta conta, ignore este e-mail.</p>
	`,
	};
}

export function buildPasswordResetEmail(
	name: string,
	resetUrl: string,
): MailContent {
	const safeName = escapeHtml(name);
	const safeUrl = escapeHtml(resetUrl);

	return {
		subject: "Redefinição de senha",
		text: `Olá, ${name}!\n\nRedefina sua senha acessando: ${resetUrl}\n\nSe você não solicitou isso, ignore este e-mail.`,
		html: `
		<p>Olá, <strong>${safeName}</strong>!</p>
		<p>Redefina sua senha clicando no link abaixo:</p>
		<p><a href="${safeUrl}">${safeUrl}</a></p>
		<p>Se você não solicitou isso, ignore este e-mail.</p>
	`,
	};
}

export function buildEmailChangeEmail(
	name: string,
	newEmail: string,
	verifyUrl: string,
): MailContent {
	const safeName = escapeHtml(name);
	const safeEmail = escapeHtml(newEmail);
	const safeUrl = escapeHtml(verifyUrl);

	return {
		subject: "Confirme a alteração do seu e-mail",
		text: `Olá, ${name}!\n\nRecebemos um pedido para alterar o e-mail da sua conta para ${newEmail}.\n\nConfirme a alteração acessando: ${verifyUrl}\n\nSeu endereço atual continuará ativo até que você confirme pelo link acima. Se você não solicitou isso, ignore este e-mail.`,
		html: `
		<p>Olá, <strong>${safeName}</strong>!</p>
		<p>Recebemos um pedido para alterar o e-mail da sua conta para <strong>${safeEmail}</strong>.</p>
		<p>Confirme a alteração clicando no link abaixo:</p>
		<p><a href="${safeUrl}">${safeUrl}</a></p>
		<p>Seu endereço atual continuará ativo até que você confirme pelo link acima. Se você não solicitou isso, ignore este e-mail.</p>
	`,
	};
}
