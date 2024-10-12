import { Request, Response } from "express";
import { DepositService } from "@internal/deposits/deposits";
import { StoredUserData } from "@internal/users/storage";

type RequestWithUser = Request & {
  user?: StoredUserData;
};

interface BurnRequest {
  amount: number;
  accountHolder: string;
  rut: string;
  accountNumber: string;
  bankId: string;
  user: NonNullable<RequestWithUser['user']>;
}

function validateBurnRequest(req: RequestWithUser): BurnRequest | { error: string } {
  const { amount, accountHolder, rut, accountNumber, bankId } = req.body;
  const user = req.user;

  if (!user) {
    return { error: "User not authenticated" };
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return { error: "Invalid amount" };
  }

  if (!accountHolder || !rut || !accountNumber || !bankId) {
    return { error: "Missing required fields" };
  }

  return { amount, accountHolder, rut, accountNumber, bankId, user };
}

export function registerBurnRequestHandler(depositService: DepositService) {
  return async (req: RequestWithUser, res: Response) => {
    try {
      const validationResult = validateBurnRequest(req);

      if ('error' in validationResult) {
        return res.status(400).json({ error: validationResult.error });
      }

      const { amount, accountHolder, rut, accountNumber, bankId, user } = validationResult;

      const burnRequest = await depositService.requestBurn(
        user,
        amount,
        accountHolder,
        rut,
        accountNumber,
        bankId
      );

      const responseData = {
        id: burnRequest.id,
        email: burnRequest.email,
        amount: burnRequest.amount,
        status: burnRequest.status,
        createdAt: burnRequest.createdAt,
      };

      return res.status(201).json({
        message: "Burn request registered successfully",
        burnRequest: responseData
      });
    } catch (error) {
      console.error("Error registering burn request:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}