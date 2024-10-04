import { Request, Response } from "express";
import { VaultContext } from "./routes";

export function getVaultBalanceHistoryHandler(ctx: VaultContext) {
  return async (req: Request, res: Response) => {
    try {
      const { period } = req.query;
      let balanceHistory;

      if (period && ['day', 'week', 'month', 'year'].includes(period as string)) {
        balanceHistory = await ctx.storageService.getHistoricalBalance(period as 'day' | 'week' | 'month' | 'year');
      } else if (!period) {
        balanceHistory = await ctx.storageService.getHistoricalBalance('year');
      } else {
        return res.status(400).json({ error: "Invalid period. Use 'day', 'week', 'month', or 'year'." });
      }

      res.status(200).json({ balanceHistory });
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "An unknown error occurred" });
      }
    }
  };
}