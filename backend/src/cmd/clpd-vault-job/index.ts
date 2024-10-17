import 'module-alias/register';

import { config } from "@internal";
import { Firestore } from '@google-cloud/firestore';
import { DiscordNotificationService, NotificationType } from '@internal/notifications';
import { ethers } from 'ethers';
import { SantanderClScraper, VaultBalanceStorage } from '@internal/bank-scrap';

if (!config.PROJECT_ID || !config.API_KEY) {
  throw new Error("❌ Required environment variables are missing");
}

const RPC_URL = config.RPC_URL;
const CONTRACT_ADDRESS = '0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1'; 
const ABI = ['function totalSupply() view returns (uint256)'];

const firestore = new Firestore({projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV});
const discordService = new DiscordNotificationService();
const vaultBalanceStorage = new VaultBalanceStorage();
const santanderScraper = new SantanderClScraper();

async function getVaultBalance(): Promise<number> {
  try {
    return await santanderScraper.getVaultBalance();
  } catch (error) {
    console.error('❌ Error fetching vault balance:', error);
    if (error instanceof Error) {
      await vaultBalanceStorage.notifyError(error, discordService);
    }
    throw error;
  }
}

async function sendDiscrepancyAlert(balance: number, totalSupply: number, discrepancyCount: number): Promise<void> {
  const difference = Math.abs(balance - totalSupply);
  const percentageDifference = (difference / totalSupply) * 100;

  let message = `Discrepancy detected:\nVault Balance: ${balance}\nTotal Supply: ${totalSupply}\nDifference: ${difference.toFixed(2)} (${percentageDifference.toFixed(2)}%)\nOccurrence: ${discrepancyCount}`;

  if (discrepancyCount === 1) {
    await discordService.sendNotification(
      message,
      NotificationType.INFO,
      'Balance Discrepancy Detected',
      undefined,
      'alert'
    );
  } else if (discrepancyCount === 5) {
    message += '\nThis discrepancy has persisted for 5 consecutive checks.';
    await discordService.sendNotification(
      message,
      NotificationType.WARNING,
      'Persistent Balance Discrepancy',
      undefined,
      'alert'
    );
  } else if (discrepancyCount >= 10) {
    message += '\nThis discrepancy has persisted for 10 or more consecutive checks. Immediate attention required.';
    await discordService.sendNotification(
      message,
      NotificationType.EMERGENCY,
      'Critical Balance Discrepancy',
      undefined,
      'alert'
    );
  }
}

async function getTotalSupply(): Promise<number> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const totalSupply = await contract.totalSupply();
    return Number(ethers.formatUnits(totalSupply, 18));
  } catch (error) {
    console.error('Error getting total supply:', error);
    if (error instanceof Error) {
      await discordService.sendNotification(
        `Error getting total supply: ${error}`,
        NotificationType.ERROR,
        'Total Supply Error',
        undefined,
        'alert'
      );
    }
    throw error;
  }
}

async function getDiscrepancyCount(): Promise<number> {
  const docRef = firestore.collection('vault').doc('discrepancyCount');
  const doc = await docRef.get();
  return doc.exists ? doc.data()?.count || 0 : 0;
}

async function updateDiscrepancyCount(count: number): Promise<void> {
  await firestore.collection('vault').doc('discrepancyCount').set({ count });
}

async function main(): Promise<void> {
  console.log("🚀 Starting vault balance update job...");

  try {
    await vaultBalanceStorage.createTableIfNotExists();

    const balance = await getVaultBalance();
    console.log(`📊 Current vault balance: ${balance}`);

    await vaultBalanceStorage.saveBalance(balance);

    const totalSupply = await getTotalSupply();
    console.log(`📊 Current total supply: ${totalSupply}`);

    const threshold = 0.001;
    const isDiscrepancy = Math.abs(balance - totalSupply) / totalSupply > threshold;

    if (isDiscrepancy) {
      let discrepancyCount = await getDiscrepancyCount();
      discrepancyCount++;

      await sendDiscrepancyAlert(balance, totalSupply, discrepancyCount);
      await updateDiscrepancyCount(discrepancyCount);
    } else {
      if (await getDiscrepancyCount() > 0) {
        await discordService.sendNotification(
          `Balance discrepancy resolved. Current balance: ${balance}`,
          NotificationType.SUCCESS,
          'Balance Discrepancy Resolved',
          undefined,
          'alert'
        );
      }
      await updateDiscrepancyCount(0);
    }

    console.log("🏁 Balance update job completed");
  } catch (error) {
    console.error("❌ Error in the update job:", error);
    await discordService.sendNotification(
      `Error in vault balance update job: ${error}`,
      NotificationType.ERROR,
      'Vault Balance Update Job Error',
      undefined,
      'alert'
    );
    process.exit(1);
  }
}

main();