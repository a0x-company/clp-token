import { Request, Response } from "express";
import { DepositService } from "@internal/deposits";

export function approveRejectDepositHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const { depositId, token } = req.params;
      const { action, reason } = req.body;

      if (action !== 'approve' && action !== 'reject') {
        return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
      }

      if (action === 'approve') {
        await depositService.approveDeposit(depositId, token);
        return res.status(200).json({ message: "Deposit approved successfully" });
      } else {
        if (!reason) {
          return res.status(400).json({ error: "Reason is required for rejection" });
        }
        await depositService.rejectDeposit(depositId, reason, token);
        return res.status(200).json({ message: "Deposit rejected successfully" });
      }
    } catch (error) {
      console.error("Error approving/rejecting deposit:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}