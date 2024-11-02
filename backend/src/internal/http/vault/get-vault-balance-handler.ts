import { Request, Response } from "express";
import { VaultContext } from "./routes";
import { Firestore } from "@google-cloud/firestore";
import { config } from "@internal";
import { DiscordNotificationService, NotificationType } from "@internal/notifications";

const firestore = new Firestore({ projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV });
const discordService = new DiscordNotificationService();

const LOCK_COLLECTION = "locks";
const LOCK_DOCUMENT = "vault_lock";
// Maximum time to wait while trying to acquire a lock (45 seconds)
// Prevents indefinite waiting if the lock can't be acquired
const ACQUIRE_LOCK_TIMEOUT = 45000;

// Time to wait between lock acquisition attempts (1 second)
// Allows for a short pause before retrying to acquire the lock
const LOCK_RETRY_DELAY = 1000;

// Maximum number of scraping attempts before giving up
// Limits the number of retries to prevent infinite loops
const MAX_RETRIES = 5;

// Time to wait between scraping attempts (30 seconds)
// Provides a delay between retries to allow for potential temporary issues to resolve
const RETRY_DELAY = 30000;

// Cooldown period for error notifications (5 minutes)
// Prevents spamming notifications for the same error within this time frame
const ERROR_COOLDOWN = 300000;

// Time after which a lock is considered expired (5 minutes)
// Prevents a lock from being held indefinitely if a process crashes or fails to release it
const LOCK_EXPIRATION = 300000;

async function initializeLockDocument(): Promise<void> {
  const lockRef = firestore.collection(LOCK_COLLECTION).doc(LOCK_DOCUMENT);
  const lockDoc = await lockRef.get();

  if (!lockDoc.exists) {
    await lockRef.set({ locked: false, lockedAt: null });
    console.log("🔒 Lock document initialized.");
  }
}

async function acquireLock(): Promise<boolean> {
  const lockRef = firestore.collection(LOCK_COLLECTION).doc(LOCK_DOCUMENT);

  try {
    await firestore.runTransaction(async (transaction) => {
      const lockDoc = await transaction.get(lockRef);

      if (!lockDoc.exists) {
        transaction.set(lockRef, { locked: false, lockedAt: null });
        throw new Error("Lock document initialized. Please try again.");
      }

      const lockData = lockDoc.data();

      if (lockData && (!lockData.locked || Date.now() - lockData.lockedAt > LOCK_EXPIRATION)) {
        transaction.update(lockRef, { locked: true, lockedAt: Date.now() });
      } else {
        throw new Error("Lock already acquired.");
      }
    });

    console.log("🔒 Lock acquired successfully.");
    return true;
  } catch (error: any) {
    if (
      error.message === "Lock already acquired." ||
      error.message === "Lock document initialized. Please try again."
    ) {
      console.log("🔒 Unable to acquire lock: already in use or just initialized.");
      return false;
    } else {
      console.error("❌ CRITICAL: Error acquiring lock:", error);
      throw error;
    }
  }
}

async function releaseLock(): Promise<void> {
  const lockRef = firestore.collection(LOCK_COLLECTION).doc(LOCK_DOCUMENT);

  try {
    await firestore.runTransaction(async (transaction) => {
      const lockDoc = await transaction.get(lockRef);

      if (lockDoc.exists) {
        transaction.update(lockRef, { locked: false, lockedAt: null });
        console.log("🔓 Lock released successfully.");
      } else {
        console.log("🔓 Lock document not found.");
      }
    });
  } catch (error) {
    console.error("❌ CRITICAL: Error releasing lock:", error);
    throw error;
  }
}

async function shouldNotify(errorType: string): Promise<boolean> {
  const errorRef = firestore.collection("scraper_errors").doc(errorType);
  const errorDoc = await errorRef.get();

  if (!errorDoc.exists) {
    await errorRef.set({ lastNotified: Date.now() });
    return true;
  }

  const lastNotified = errorDoc.data()?.lastNotified;
  if (Date.now() - lastNotified > ERROR_COOLDOWN) {
    await errorRef.update({ lastNotified: Date.now() });
    return true;
  }

  return false;
}

async function notifyError(message: string, notificationType: NotificationType): Promise<void> {
  const errorType =
    notificationType === NotificationType.ERROR ? "scraper_error" : "scraper_warning";
  if (await shouldNotify(errorType)) {
    await discordService.sendNotification(
      message,
      notificationType,
      "CRITICAL: Santander Scraper Alert",
      undefined,
      "alert"
    );
    console.log(`🚨 Error notification sent: ${message}`);
  } else {
    console.log(`ℹ️ Error notification skipped due to cooldown: ${message}`);
  }
}

export function getVaultBalanceHandler(ctx: VaultContext) {
  return async (req: Request, res: Response) => {
    const isStorageRoute = req.path.endsWith("/storage");
    let balance: number | null = null;

    try {
      await initializeLockDocument();
      console.log("🔧 Lock document initialized.");

      if (isStorageRoute) {
        balance = await ctx.storageService.getCurrentBalance();
        console.log("💾 Balance retrieved from storage.");
      } else {
        balance = await attemptScraping(ctx);
      }

      if (balance === null) {
        throw new Error("❌ CRITICAL: No balance available.");
      }

      res.status(200).json({ balance });
      console.log(`📊 Balance returned: ${balance}`);
    } catch (error: unknown) {
      handleError(error, res);
    }
  };
}

async function attemptScraping(ctx: VaultContext): Promise<number | null> {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    let lockAcquired = false;
    try {
      console.log(`🔄 Scraping attempt ${retries + 1} of ${MAX_RETRIES}`);
      lockAcquired = await acquireLock();
      if (!lockAcquired) {
        console.log("🔒 Unable to acquire lock. Waiting before next attempt.");
        await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_DELAY));
        continue;
      }

      console.log("🕷️ Starting scraping process.");
      const balance = await ctx.scrapService.getVaultBalance();
      if (balance === 0) {
        throw new Error("❌ CRITICAL: Scraped balance is 0.");
      }
      console.log(`✅ Scraping successful. Balance: ${balance}`);
      return balance;
    } catch (error) {
      console.error(`❌ CRITICAL: Error during attempt ${retries + 1}:`, error);
      await notifyError(
        `CRITICAL: Scraping attempt ${retries + 1} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        NotificationType.ERROR
      );
      retries++;
    } finally {
      if (lockAcquired) {
        await releaseLock();
        console.log("🔓 Lock released after scraping attempt.");
      }
    }

    if (retries < MAX_RETRIES) {
      console.log(`⏳ Waiting ${RETRY_DELAY / 1000} seconds before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  console.error(`❌ CRITICAL: All ${MAX_RETRIES} scraping attempts failed.`);
  await notifyError(
    `CRITICAL: All ${MAX_RETRIES} scraping attempts failed. System may be at risk.`,
    NotificationType.ERROR
  );
  return null;
}
 
function handleError(error: unknown, res: Response) {
  if (error instanceof Error) {
    console.error(`❌ CRITICAL ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  } else {
    console.error("❌ CRITICAL: An unknown error occurred.");
    res.status(500).json({ error: "An unknown error occurred." });
  }
  notifyError(
    `CRITICAL: Vault balance retrieval failed. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    NotificationType.ERROR
  );
}