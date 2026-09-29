export class PostAlreadyPublishedError extends Error {
  constructor() {
    super("Post already published.");
    this.name = "PostAlreadyPublishedError";
  }
}
