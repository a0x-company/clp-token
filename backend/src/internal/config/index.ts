// environment
export const PROJECT_ID = process.env.PROJECT_ID;
export const DATABASE_ENV = process.env.DATABASE_ENV || "(default)";

export const A0X_API_KEY = process.env.A0X_API_KEY;

export const VAULT_RUT = process.env.VAULT_RUT;
export const VAULT_PASSWORD = process.env.VAULT_PASSWORD;

function stopProgram(envKey: string) {
  console.error(`no ${envKey} specified in enviroment variable`);
  process.exit(1);
}

// validation
export function validateRequiredEnvs() {
  if (!PROJECT_ID) stopProgram("PROJECT_ID");
  if (!A0X_API_KEY) stopProgram("A0X_API_KEY");
}

export function validateVaultApiEnvs() {
  if (!A0X_API_KEY) stopProgram("A0X_API_KEY");
  if (!VAULT_RUT) stopProgram("VAULT_RUT");
  if (!VAULT_PASSWORD) stopProgram("VAULT_PASSWORD");
}
