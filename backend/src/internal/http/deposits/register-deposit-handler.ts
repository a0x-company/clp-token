import { Request, Response } from "express";
import { DepositService } from "@internal/deposits/deposits";
import { StoredUserData } from "@internal/users/storage";

type RequestWithUser = Request & {
  user?: StoredUserData;
};

interface DepositRequest {
  amount: number;
  user: NonNullable<RequestWithUser['user']>;
}

function validateDepositRequest(req: RequestWithUser): DepositRequest | { error: string } {
  const { amount } = req.body;
  const user = req.user;

  if (!user) {
    return { error: "User not authenticated" };
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return { error: "Invalid amount" };
  }

  return { amount, user };
}

export function registerDepositHandler(depositService: DepositService) {
  return async (req: RequestWithUser, res: Response) => {
    try {
      const validationResult = validateDepositRequest(req);

      if ('error' in validationResult) {
        return res.status(400).json({ error: validationResult.error });
      }

      const { amount, user } = validationResult;

      const deposit = await depositService.registerDeposit(
        user,
        amount
      );

      const responseData = {
        id: deposit.id,
        email: deposit.email,
        address: deposit.address,
        amount: deposit.amount,
        status: deposit.status,
        createdAt: deposit.createdAt,
      };

      return res.status(201).json({
        message: "Deposit registered successfully",
        deposit: responseData
      });
    } catch (error) {
      console.error("Error registering deposit:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}