import { UserService } from "@internal/users";
import { Request, Response } from "express";


export function createUserHandler(userService: UserService) {
  return async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Token is missing" });
      }

      await userService.saveUser(token);
      
      const user = await userService.getUser({ token });
      
      if (!user) {
        return res.status(500).json({ error: "Error creating/getting user" });
      }

      return res.status(201).json({
        address: user.address,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}