import { Request, Response } from "express";
import { DepositService } from "@internal/deposits/deposits";
import { BurnStatus } from "@internal/deposits/storage";

export function getBurnRequestsByStatusHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const { status } = req.params;

      if (!Object.values(BurnStatus).includes(status as BurnStatus)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const burnRequests = await depositService.getBurnRequestsByStatus(status as BurnStatus);

      return res.status(200).json({
        burnRequests: burnRequests.map(request => ({
          id: request.id,
          email: request.email,
          amount: request.amount,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        }))
      });
    } catch (error) {
      console.error("Error getting burn requests:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}