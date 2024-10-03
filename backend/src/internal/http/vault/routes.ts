// third-party
import { Express, Router } from "express";

// service
import { getVaultBalanceHandler } from "./get-vault-balance-handler";
import { getVaultBalanceHistoryHandler } from "./get-vault-balance-history-handler";
import { VaultBalanceStorage } from "@internal/bank-scrap/storage";

interface VaultGetter {
  getVaultBalance(): Promise<number>;
}

export type VaultContext = {
  scrapService: VaultGetter;
  storageService: VaultBalanceStorage;
};

export function setupVaultRoutes(router: Express, ctx: VaultContext) {
  const vaultRouter = Router();

  vaultRouter.get("/balance", getVaultBalanceHandler(ctx));
  vaultRouter.get("/balance/storage", getVaultBalanceHandler(ctx));
  vaultRouter.get("/balance/history", getVaultBalanceHistoryHandler(ctx));

  router.use("/vault", vaultRouter);
  console.log("🚀 Vault routes set up");
}