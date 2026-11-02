import { validateUpdateEmail } from "../middlewares/validateUpdateEmail";
import { validateUpdatePassword } from "../middlewares/validateUpdatePassword";
import { getFacilitatedWorkshopsController } from "./getFacilitatedWorkshopsController";
import { searchUserByEmailController } from "./searchUserByEmailController";
import { updateUserEmailController } from "./updateUserEmailController";
import { updateUserPasswordController } from "./updateUserPasswordController";

import { Router } from "express";
import { validateAuthenticate } from "../middlewares/validateAuthenticate";
import { validateJWT } from "../middlewares/validateJWT";
import { validateRegister } from "../middlewares/validateRegister";
import { validateUpdateProfile } from "../middlewares/validateUpdateProfile";
import { authenticateController } from "./authenticateController";
import { forgotPasswordController } from "./forgotPasswordController";
import { getEmittedSessionsController } from "./getEmittedSessionsController";
import { getEnrolledSessionsController } from "./getEnrolledSessionsController";
import { getUserProfileController } from "./getUserProfileController";
import { registerController } from "./registerController";
import { resendVerificationController } from "./resendVerificationController";
import { resetPasswordController } from "./resetPasswordController";
import { updateUserProfileController } from "./updateUserProfileController";
import { verifyEmailController } from "./verifyEmailController";

const userRouter = Router();

userRouter.post("/users", validateRegister, registerController);
userRouter.post(
	"/users/authenticate",
	validateAuthenticate,
	authenticateController,
);
userRouter.post("/users/verify-email", verifyEmailController);
userRouter.post("/users/resend-verification", resendVerificationController);
userRouter.post("/users/forgot-password", forgotPasswordController);
userRouter.post("/users/reset-password", resetPasswordController);

// Protected routes
userRouter.get(
	"/my-emmitted-sessions",
	validateJWT(),
	getEmittedSessionsController,
);
userRouter.get(
	"/my-enrolled-sessions",
	validateJWT(),
	getEnrolledSessionsController,
);

userRouter.get(
	"/my-facilitated-workshops",
	validateJWT(),
	getFacilitatedWorkshopsController,
);

userRouter.get("/users/search", validateJWT(), searchUserByEmailController);

userRouter.get("/users/profile", validateJWT(), getUserProfileController);

userRouter.patch(
	"/users/profile",
	validateJWT(),
	validateUpdateProfile,
	updateUserProfileController,
);

userRouter.patch(
	"/users/password",
	validateJWT(),
	validateUpdatePassword,
	updateUserPasswordController,
);

userRouter.patch(
	"/users/email",
	validateJWT(),
	validateUpdateEmail,
	updateUserEmailController,
);

export default userRouter;
