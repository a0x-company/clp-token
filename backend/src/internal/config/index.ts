// environment
export const PROJECT_ID = process.env.PROJECT_ID;
export const DATABASE_ENV = process.env.DATABASE_ENV || "(default)";

export const API_KEY = process.env.API_KEY;

export const VAULT_RUT = process.env.VAULT_RUT;
export const VAULT_PASSWORD = process.env.VAULT_PASSWORD;

export const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export const RPC_URL = process.env.RPC_URL;

function stopProgram(envKey: string) {
  console.error(`no ${envKey} specified in enviroment variable`);
  process.exit(1);
}

// validation
export function validateRequiredEnvs() {
  if (!PROJECT_ID) stopProgram("PROJECT_ID");
  if (!API_KEY) stopProgram("API_KEY");
  if (!DATABASE_ENV) stopProgram("DATABASE_ENV");
}

export function validateVaultApiEnvs() {
  if (!API_KEY) stopProgram("API_KEY");
  if (!VAULT_RUT) stopProgram("VAULT_RUT");
  if (!VAULT_PASSWORD) stopProgram("VAULT_PASSWORD");
  if (!DISCORD_WEBHOOK_URL) stopProgram("DISCORD_WEBHOOK_URL");
}
