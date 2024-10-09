import 'module-alias/register';

import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import { config } from "@internal";
import { Firestore } from '@google-cloud/firestore';
import { DiscordNotificationService, NotificationType } from '@internal/notifications';
import { ethers } from 'ethers';

if (!config.PROJECT_ID || !config.API_KEY) {
  throw new Error("❌ Required environment variables are missing");
}

const VAULT_API_URL = 'https://development-clpd-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance';
const DATASET_ID = 'vault_data';
const TABLE_ID = 'balance_history';
const RPC_URL = config.RPC_URL;
const CONTRACT_ADDRESS = '0xe97d2Ed8261b6aeE31fD216916E2FcE7252F44ed'; 
const ABI = ['function totalSupply() view returns (uint256)'];

const firestore = new Firestore({projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV});
const discordService = new DiscordNotificationService(config.DISCORD_WEBHOOK_URL as string);

interface VaultBalance {
  balance: number;
}

async function getVaultBalance(): Promise<VaultBalance> {
  try {
    const response = await axios.get<VaultBalance>(VAULT_API_URL, {
      headers: {
        'api-key': config.API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching vault balance:', error);
    throw error;
  }
}

async function saveBalanceToBigQuery(balance: number): Promise<void> {
  const bigquery = new BigQuery({
    projectId: config.PROJECT_ID,
  });

  const row = {
    timestamp: BigQuery.timestamp(new Date()),
    balance: balance
  };

  try {
    await bigquery
      .dataset(DATASET_ID)
      .table(TABLE_ID)
      .insert([row]);
    console.log('✅ Balance saved to BigQuery');
  } catch (error) {
    console.error('❌ Error saving to BigQuery:', error);
    throw error;
  }
}

async function createTableIfNotExists(): Promise<void> {
  const bigquery = new BigQuery({
    projectId: config.PROJECT_ID,
  });

  const schema = [
    { name: 'timestamp', type: 'TIMESTAMP' },
    { name: 'balance', type: 'FLOAT' },
  ];

  try {
    await bigquery
      .dataset(DATASET_ID)
      .createTable(TABLE_ID, { schema });
    console.log('✅ Table created in BigQuery');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ The table already exists in BigQuery');
    } else {
      console.error('❌ Error creating the table in BigQuery:', error);
      throw error;
    }
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
      'Balance Discrepancy Detected'
    );
  } else if (discrepancyCount === 5) {
    message += '\nThis discrepancy has persisted for 5 consecutive checks.';
    await discordService.sendNotification(
      message,
      NotificationType.WARNING,
      'Persistent Balance Discrepancy'
    );
  } else if (discrepancyCount >= 10) {
    message += '\nThis discrepancy has persisted for 10 or more consecutive checks. Immediate attention required.';
    await discordService.sendNotification(
      message,
      NotificationType.EMERGENCY,
      'Critical Balance Discrepancy'
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
    console.error('Error al obtener el total supply:', error);
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
    await createTableIfNotExists();

    const { balance } = await getVaultBalance();
    console.log(`📊 Current vault balance: ${balance}`);

    const totalSupply = await getTotalSupply();
    console.log(`📊 Current total supply: ${totalSupply}`);

    await saveBalanceToBigQuery(balance);

    const threshold = 0.001; // 0.1% threshold for discrepancy
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
          'Balance Discrepancy Resolved'
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
      'Vault Balance Update Job Error'
    );
    process.exit(1);
  }
}


main();