export function generateSlug(title: string): string {
	return title
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
