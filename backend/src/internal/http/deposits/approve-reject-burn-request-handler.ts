import { Request, Response } from "express";
import { DepositService } from "@internal/deposits";

export function approveRejectBurnRequestHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const { burnRequestId } = req.params;
      const { action, reason, transactionHash } = req.body;

      if (action !== 'approve' && action !== 'reject') {
        return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
      }

      let message: string;

      if (action === 'approve') {
        if (!transactionHash) {
          return res.status(400).json({ error: "Transaction hash is required for approval" });
        }
        await depositService.approveBurnRequest(burnRequestId, transactionHash);
        message = `Burn request approved successfully`;
      } else {
        if (!reason) {
          return res.status(400).json({ error: "Reason is required for rejection" });
        }
        await depositService.rejectBurnRequest(burnRequestId, reason);
        message = `Burn request rejected successfully`;
      }

      return res.status(200).json({ message });
    } catch (error) {
      console.error("Error approving/rejecting burn request:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}