import { Router } from "express";
import { validateOptionalJWT } from "../middlewares/validateOptionalJWT";
import { getPostBySlugController } from "./getPostBySlugController";
import { listPostsController } from "./listPostsController";

const postsRouter = Router();

// Públicas

postsRouter.get("/posts", validateOptionalJWT(), listPostsController);

postsRouter.get("/posts/:slug", validateOptionalJWT(), getPostBySlugController);

// Protegidas

export default postsRouter;
