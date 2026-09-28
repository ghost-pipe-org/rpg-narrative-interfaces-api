import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["dev", "test", "production", "staging"]).default("dev"),
	JWT_SECRET: z.string(),
	PORT: z.coerce.number().default(3001),

	ADMIN_EMAIL: z.string().email().optional(),
	ADMIN_PASSWORD: z.string().min(8).optional(),
	ADMIN_NAME: z.string().optional(),

	GOOGLE_CLIENT_ID: z.string().optional(),
	FRONTEND_URL: z.string().url().default("http://localhost:5173"),

	GMAIL_USER: z.string().email().optional(),
	GMAIL_APP_PASSWORD: z.string().optional(),
	GMAIL_FROM: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
	console.error("❌ Variáveis de ambiente inválidas", _env.error.format());

	throw new Error("Variáveis de ambiente inválidas.");
}

export const env = _env.data;
