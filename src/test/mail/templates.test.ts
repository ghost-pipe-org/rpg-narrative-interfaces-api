import { InMemoryMailService } from "@/mail/inMemoryMailService";
import {
	buildEmailChangeEmail,
	buildPasswordResetEmail,
	buildVerificationEmail,
} from "@/mail/templates";
import { describe, expect, it } from "vitest";

describe("mail templates", () => {
	it("builds the verification email with the link", () => {
		const mail = buildVerificationEmail("Ana", "http://x/verify?token=abc");
		expect(mail.subject).toBe("Confirme seu e-mail");
		expect(mail.text).toContain("http://x/verify?token=abc");
		expect(mail.html).toContain('href="http://x/verify?token=abc"');
	});

	it("builds the password reset email with the link", () => {
		const mail = buildPasswordResetEmail("Ana", "http://x/reset?token=abc");
		expect(mail.subject).toBe("Redefinição de senha");
		expect(mail.html).toContain("http://x/reset?token=abc");
	});

	it("builds the email change confirmation email with new address and link", () => {
		const mail = buildEmailChangeEmail(
			"Ana",
			"ana.nova@example.com",
			"http://x/verify-email?token=abc",
		);
		expect(mail.subject).toBe("Confirme a alteração do seu e-mail");
		expect(mail.text).toContain("ana.nova@example.com");
		expect(mail.html).toContain('href="http://x/verify-email?token=abc"');
	});

	it("escapes HTML in the user name", () => {
		const mail = buildVerificationEmail("<script>x</script>", "http://x");
		expect(mail.html).not.toContain("<script>");
		expect(mail.html).toContain("&lt;script&gt;");
	});
});

describe("InMemoryMailService", () => {
	it("stores sent messages", async () => {
		const service = new InMemoryMailService();
		await service.send({ to: "a@a.com", subject: "s", text: "t", html: "h" });
		expect(service.sent).toHaveLength(1);
	});
});
