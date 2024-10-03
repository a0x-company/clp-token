// third-party
import { Express, Router } from "express";

// service
import { createUserHandler } from "./create-user-handler";
import { UserService } from "@internal/users";


export function setupUserRoutes(
  router: Express,
  userService: UserService
) {
  const userRouter = Router();
  
  
  userRouter.post("/", createUserHandler(userService));

  router.use("/users", userRouter);
  console.log("User routes set up");
}