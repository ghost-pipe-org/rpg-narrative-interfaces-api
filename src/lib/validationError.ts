import type { ZodError } from "zod";

export const VALIDATION_ERROR_CODE = "VALIDATION_ERROR";

export type ValidationErrorBody = {
	message: string;
	code: typeof VALIDATION_ERROR_CODE;
	errors: ZodError["errors"];
};

export function validationErrorBody(
	error: ZodError,
	fallbackMessage = "Dados inválidos",
): ValidationErrorBody {
	const firstMessage = error.errors[0]?.message?.trim();
	return {
		message:
			firstMessage && firstMessage !== "Invalid"
				? firstMessage
				: fallbackMessage,
		code: VALIDATION_ERROR_CODE,
		errors: error.errors,
	};
}
