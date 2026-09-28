import { env } from "@/env/index";
import { OAuth2Client } from "google-auth-library";
import { InvalidCredentialsError } from "@/services/errors/invalidCredentialsError";

export interface GoogleIdentity {
	googleId: string;
	email: string;
	name?: string;
	emailVerified: boolean;
}

const client = new OAuth2Client();

export async function verifyGoogleIdToken(
	googleIdToken: string,
): Promise<GoogleIdentity> {
	if (!env.GOOGLE_CLIENT_ID) {
		throw new Error("GOOGLE_CLIENT_ID não está configurado");
	}

	try {
		const ticket = await client.verifyIdToken({
			idToken: googleIdToken,
			audience: env.GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();

		if (!payload?.sub || !payload.email) {
			throw new InvalidCredentialsError();
		}

		if (!payload.email_verified) {
			throw new InvalidCredentialsError();
		}

		return {
			googleId: payload.sub,
			email: payload.email,
			name: payload.name,
			emailVerified: true,
		};
	} catch (error) {
		if (error instanceof InvalidCredentialsError) {
			throw error;
		}

		throw new InvalidCredentialsError();
	}
}
