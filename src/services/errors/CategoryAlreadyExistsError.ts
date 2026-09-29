export class CategoryAlreadyExistsError extends Error {
  constructor() {
    super("Category with this name or slug already exists.");
    this.name = "CategoryAlreadyExistsError";
  }
}
