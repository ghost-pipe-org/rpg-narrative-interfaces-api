export class SlugAlreadyExistsError extends Error {
  constructor() {
    super("Slug already exists.");
    this.name = "SlugAlreadyExistsError";
  }
}
