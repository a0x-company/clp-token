// third-party
import { Express, Router } from "express";

// service
import { createUserHandler } from "./create-user-handler";
import { UserService, UserDataStorage } from "@internal/users";


export function setupUserRoutes(
  router: Express,
  userDataStorage: UserDataStorage
) {
  const userRouter = Router();
  const userService = new UserService(userDataStorage);
  
  userRouter.post("/", createUserHandler(userService));

  router.use("/users", userRouter);
  console.log("🚀 Mistokens User routes set up");
}