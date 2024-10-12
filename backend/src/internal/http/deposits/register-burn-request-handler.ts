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
    email: string;
    user: NonNullable<RequestWithUser['user']>;
}

function validateBurnRequest(req: RequestWithUser): BurnRequest | { error: string } {
    const { amount, accountHolder, rut, accountNumber, bankId, email } = req.body;
    const user = req.user;
  
    if (!user) {
      return { error: "Usuario no autenticado" };
    }
  
    if (!amount || isNaN(amount) || amount <= 0) {
      return { error: "Monto inválido" };
    }
  
    if (!accountHolder || !rut || !accountNumber || !bankId || !email) {
      return { error: "Faltan campos requeridos" };
    }
  
    // Validación básica del email
    if (!/\S+@\S+\.\S+/.test(email)) {
      return { error: "Email inválido" };
    }
  
    return { amount, accountHolder, rut, accountNumber, bankId, email, user };
  }

export function registerBurnRequestHandler(depositService: DepositService) {
  return async (req: RequestWithUser, res: Response) => {
    try {
        const validationResult = validateBurnRequest(req);

        if ('error' in validationResult) {
          return res.status(400).json({ error: validationResult.error });
        }
  
        const { amount, accountHolder, rut, accountNumber, bankId, email, user } = validationResult;
  
        const burnRequest = await depositService.requestBurn(
          user,
          amount,
          accountHolder,
          rut,
          accountNumber,
          bankId,
          email
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