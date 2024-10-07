import { Request, Response } from "express";
import { DepositService, DepositStatus } from "@internal/deposits";

export function getDepositsByStatusHandler(depositService: DepositService) {
  return async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      
      if (!Object.values(DepositStatus).includes(status as DepositStatus)) {
        return res.status(400).json({ error: "Invalid deposit status" });
      }

      const deposits = await depositService.getDepositsByStatus(status as DepositStatus);

      return res.status(200).json({
        deposits: deposits
      });
    } catch (error) {
      console.error("Error getting deposits by status:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}