export class PostNotDraftError extends Error {
  constructor() {
    super("Post does not have DRAFT status.");
    this.name = "PostNotDraftError";
  }
}
