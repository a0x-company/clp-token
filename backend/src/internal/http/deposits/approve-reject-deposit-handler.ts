import { Request, Response } from "express";
import { DepositService } from "@internal/deposits";

type ApproveRejectAction = 'approve' | 'reject';

function validateApproveRejectRequest(req: Request): { depositId: string; action: ApproveRejectAction; reason?: string } | { error: string } {
  const { depositId } = req.params;
  const { action, reason } = req.body;

  if (!depositId) {
    return { error: "Deposit ID is required" };
  }

  if (action !== 'approve' && action !== 'reject') {
    return { error: "Invalid action. Must be 'approve' or 'reject'" };
  }

  if (action === 'reject' && !reason) {
    return { error: "Reason is required for rejection" };
  }

  return { depositId, action, reason };
}

export function approveRejectDepositHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const validationResult = validateApproveRejectRequest(req);

      if ('error' in validationResult) {
        return res.status(400).json({ error: validationResult.error });
      }

      const { depositId, action, reason } = validationResult;

      if (action === 'approve') {
        await depositService.approveDeposit(depositId);
        return res.status(200).json({ message: "Deposit approved successfully" });
      } else {
        await depositService.rejectDeposit(depositId, reason!);
        return res.status(200).json({ message: "Deposit rejected successfully" });
      }
    } catch (error) {
      console.error("Error approving/rejecting deposit:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}