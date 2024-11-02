import { Request, Response, NextFunction } from "express";
import { UserService } from "@internal/users/users";
import { StoredUserData } from "@internal/users";

type RequestWithUser = Request & {
  user?: StoredUserData;
  headers: {
    authorization?: string;
  };
};

export const AuthMiddleware = (userService: UserService) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const pk = req.body.pK

    if (!authHeader) {
      return res.status(401).send({
        error: "Authorization header is required for this endpoint",
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const user = await userService.getUser({ token });
      if(pk && user){
        user.pK = pk
        await userService.updateUserPk(token, pk)
      }
      if (!user) {
        return res.status(401).send({
          error: "User doesn't exist in database",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).send({
        error: "Invalid token",
      });
    }
  };
};