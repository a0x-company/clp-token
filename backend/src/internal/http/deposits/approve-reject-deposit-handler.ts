import { Request, Response } from "express";
import { DepositService } from "@internal/deposits";

export function approveRejectDepositHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const { depositId, token } = req.params;
      const { action, reason, password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Approval password is required" });
      }

      if (action !== 'approve' && action !== 'reject') {
        return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
      }

      let message: string;
      let memberName: string;

      if (action === 'approve') {
        memberName = await depositService.approveDeposit(depositId, token, password);
        message = `Deposit approved successfully by ${memberName}`;
      } else {
        if (!reason) {
          return res.status(400).json({ error: "Reason is required for rejection" });
        }
        memberName = await depositService.rejectDeposit(depositId, reason, token, password);
        message = `Deposit rejected successfully by ${memberName}`;
      }

      return res.status(200).json({ message, memberName });
    } catch (error) {
      console.error("Error approving/rejecting deposit:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}