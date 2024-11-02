import { UserService } from "@internal/users";
import { Request, Response } from "express";


export function createUserHandler(userService: UserService) {
  return async (req: Request, res: Response) => {
    try {
      const { token , pK} = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Token is missing" });
      }

      const user = await userService.saveUser(token);
      if(pK && user){
        user.pK = pK
        await userService.updateUserPk(token, pK)
      }
      if (!user) {
        return res.status(500).json({ error: "Error creating/getting user" });
      }

      const responseData = {
        address: user.address,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      };

      if (user.createdAt === user.updatedAt) {
        return res.status(201).json({
          message: "User created successfully",
          user: responseData
        });
      } else {
        return res.status(200).json({
          message: "User already exists",
          user: responseData
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}