import type { Express, Request, Response } from "express";
import express from "express";
import postsRouter from "./posts/postsRoutes";
import sessionRouter from "./sessions/sessionsRoutes";
import workshopRouter from "./sessions/workshopsRoutes";
import userRouter from "./users/usersRoutes";

const routes = (app: Express) => {
	app
		.route("/")
		.get((req: Request, res: Response) => res.status(200).send("API Node.js"));
	app.use(
		express.json(),
		userRouter,
		sessionRouter,
		workshopRouter,
		postsRouter,
	);
};

export default routes;
