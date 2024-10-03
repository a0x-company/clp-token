import { Request, Response } from "express";
import { VaultContext } from "./routes";
import { Firestore } from '@google-cloud/firestore';

const LOCK_COLLECTION = 'locks';
const LOCK_DOCUMENT = 'vault_lock';
const ACQUIRE_LOCK_TIMEOUT = 45000;
const LOCK_RETRY_DELAY = 1000;

const firestore = new Firestore();

async function initializeLockDocument(): Promise<void> {
  const lockRef = firestore.collection(LOCK_COLLECTION).doc(LOCK_DOCUMENT);
  const lockDoc = await lockRef.get();

  if (!lockDoc.exists) {
    await lockRef.set({ locked: false });
    console.log('🔒 Lock document initialized.');
  }
}

async function acquireLock(): Promise<boolean> {
  const lockRef = firestore.collection(LOCK_COLLECTION).doc(LOCK_DOCUMENT);

  try {
    await firestore.runTransaction(async (transaction) => {
      const lockDoc = await transaction.get(lockRef);

      if (!lockDoc.exists) {
        transaction.set(lockRef, { locked: false });
        throw new Error('Lock document initialized. Please try again.');
      }

      const lockData = lockDoc.data();

      if (lockData && !lockData.locked) {
        transaction.update(lockRef, { locked: true });
      } else {
        throw new Error('Lock already acquired.');
      }
    });

    console.log('🔒 Lock acquired successfully.');
    return true;
  } catch (error: any) {
    if (error.message === 'Lock already acquired.' || error.message === 'Lock document initialized. Please try again.') {
      console.log('🔒 Unable to acquire lock: already in use.');
      return false;
    } else {
      console.error('❌ Error acquiring lock:', error);
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
        const lockData = lockDoc.data();

        if (lockData && lockData.locked) {
          transaction.update(lockRef, { locked: false });
          console.log('🔓 Lock released successfully.');
        } else {
          console.log('🔓 Lock is already released.');
        }
      } else {
        console.log('🔓 Lock document not found.');
      }
    });
  } catch (error) {
    console.error('❌ Error releasing lock:', error);
    throw error;
  }
}

export function getVaultBalanceHandler(ctx: VaultContext) {
  return async (req: Request, res: Response) => {
    const isStorageRoute = req.path.endsWith('/storage');
    let balance: number | null = null;

    try {
      await initializeLockDocument();

      if (isStorageRoute) {
        balance = await ctx.storageService.getCurrentBalance();
        console.log('💾 Balance retrieved from storage.');
      } else {
        const startTime = Date.now();
        let lockAcquired = false;

        while (Date.now() - startTime < ACQUIRE_LOCK_TIMEOUT) {
          lockAcquired = await acquireLock();
          if (lockAcquired) break;
          await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY));
        }

        if (!lockAcquired) {
          balance = await ctx.storageService.getCurrentBalance();
          console.log('🔄 Using stored balance due to inability to acquire lock.');
        } else {
          try {
            console.log('🕷️ Starting scraping process.');
            balance = await ctx.scrapService.getVaultBalance();
            if (balance === 0) {
              throw new Error('❌ Scraped balance is 0.');
            }
          } finally {
            await releaseLock();
          }
        }
      }

      if (balance === null) {
        throw new Error('❌ No balance available.');
      }

      res.status(200).json({ balance });
      console.log(`📊 Balance returned: ${balance}`);
    } catch (error: unknown) {
      if (!isStorageRoute) {
        try {
          await releaseLock();
          console.log('🔓 Lock released due to error.');
        } catch (releaseError) {
          console.error('❌ Error releasing lock after failure:', releaseError);
        }
      }

      if (error instanceof Error) {
        console.error(`❌ Error: ${error.message}`);
        res.status(500).json({ error: error.message });
      } else {
        console.error('❌ An unknown error occurred.');
        res.status(500).json({ error: "An unknown error occurred." });
      }
    }
  };
}