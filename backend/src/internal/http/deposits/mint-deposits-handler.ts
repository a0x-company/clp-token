import { Request, Response } from "express";
import { DepositService } from "@internal/deposits/deposits";

interface MintDepositRequest {
  depositId: string;
  transactionHash: string;
}

function validateMintDepositsRequest(req: Request): MintDepositRequest[] | { error: string } {
  const { deposits } = req.body;

  if (!Array.isArray(deposits) || deposits.length === 0) {
    return { error: "Invalid deposits array" };
  }

  for (const deposit of deposits) {
    if (!deposit.depositId || !deposit.transactionHash) {
      return { error: "Each deposit must have a depositId and transactionHash" };
    }
  }

  return deposits;
}

export function mintDepositsHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const validationResult = validateMintDepositsRequest(req);

      if ('error' in validationResult) {
        return res.status(400).json({ error: validationResult.error });
      }

      const deposits = validationResult;

      if (deposits.length === 1) {
        const { depositId, transactionHash } = deposits[0];
        await depositService.markDepositAsMinted(depositId, transactionHash);
        return res.status(200).json({ message: "Deposit marked as minted successfully" });
      } else {
        await depositService.markMultipleDepositsAsMinted(deposits);
        return res.status(200).json({ message: `${deposits.length} deposits marked as minted successfully` });
      }
    } catch (error) {
      console.error("Error minting deposits:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}