import 'module-alias/register';

import { ethers } from 'ethers';
import { Firestore } from '@google-cloud/firestore';
import { Storage } from "@google-cloud/storage";
import { DepositService, DepositStatus } from '@internal/deposits';
import { config } from '@internal';
import { DiscordNotificationService, NotificationType } from '@internal/notifications';

if (!config.PROJECT_ID || !config.RPC_URL || !config.RESEND_API_KEY) {
  throw new Error("❌ Required environment variables are missing");
}

const UNMINTED_DEPOSITS_THRESHOLD = 1;
const NOTIFICATION_COOLDOWN_HOURS = 4;

const MAX_BLOCK_RANGE = 5000;
const TOKEN_ADDRESS = '0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1';
const ABI = ['event TokensMinted(address indexed agent, address indexed user, uint256 amount)'];
const INITIAL_BLOCK = 21167748;

const firestore = new Firestore({ projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV });
const discordService = new DiscordNotificationService();
const depositService = new DepositService(firestore, new Storage(), config.RESEND_API_KEY);

interface TokenMintedEvent {
  agent: string;
  user: string;
  amount: number;
}

async function getLastProcessedBlock(): Promise<number> {
  const docRef = firestore.collection('blockTracking').doc('CLPDTokensMinted');
  const doc = await docRef.get();
  if (doc.exists) {
    const data = doc.data();
    return data?.lastBlock || INITIAL_BLOCK;
  } else {
    await docRef.set({ lastBlock: INITIAL_BLOCK });
    console.log(`Document created with initial block: ${INITIAL_BLOCK}`);
    return INITIAL_BLOCK;
  }
}

async function updateLastProcessedBlock(blockNumber: number): Promise<void> {
  const docRef = firestore.collection('blockTracking').doc('CLPDTokensMinted');
  await docRef.set({ lastBlock: blockNumber }, { merge: true });
  console.log(`✅ Last processed block updated to: ${blockNumber}`);
}

async function fetchAndProcessEvents(): Promise<void> {
  try {
    const lastProcessedBlock = await getLastProcessedBlock();
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const currentBlock = await provider.getBlockNumber();

    console.log(`🔍 Last processed block: ${lastProcessedBlock}`);
    console.log(`🔍 Current block: ${currentBlock}`);

    if (lastProcessedBlock >= currentBlock) {
      console.log("ℹ️ No new blocks to process.");
      return;
    }

    const contract = new ethers.Contract(TOKEN_ADDRESS, ABI, provider);
    const eventFilter = contract.filters.TokensMinted();

    let fromBlock = lastProcessedBlock + 1;
    let toBlock = Math.min(fromBlock + MAX_BLOCK_RANGE - 1, currentBlock);

    while (fromBlock <= currentBlock) {
      console.log(`🔄 Fetching events from block ${fromBlock} to ${toBlock}...`);

      const events = await contract.queryFilter(eventFilter, fromBlock, toBlock);

      console.log(`📄 Events found in this range: ${events.length}`);

      for (const event of events) {
        try {
          const parsedEvent = contract.interface.parseLog(event);
          if (parsedEvent === null) {
            console.error(`❌ Error parsing event`);
            await discordService.sendNotification(
              `❌ Error parsing TokensMinted event`,
              NotificationType.ERROR,
              'TokensMinted Event Parsing Error',
              undefined,
              'alert'
            );
            continue;
          }

          const { agent, user, amount } = parsedEvent.args;

          const tokenEvent: TokenMintedEvent = {
            agent,
            user,
            amount: Number(ethers.formatUnits(amount, 18)),
          };

          console.log(`\n🔹 Processing TokensMinted event:`);
          console.log(`  User: ${tokenEvent.user}`);
          console.log(`  Amount: ${tokenEvent.amount} CLPD`);

          const deposits = await depositService.getAcceptedDeposits();
          console.log(`🔍 Found ${deposits.length} accepted deposits`);

          const matchingDeposit = deposits.find(d => 
            d.address.toLowerCase() === tokenEvent.user.toLowerCase() && 
            Number(d.amount) === tokenEvent.amount
          );

          if (matchingDeposit) {
            await depositService.markDepositAsMinted(matchingDeposit.id, event.transactionHash);
            console.log(`✅ Deposit ${matchingDeposit.id} marked as minted`);

            await discordService.sendNotification(
              `✅ TokensMinted event processed and deposit updated:\n**Agent:** ${tokenEvent.agent}\n**User:** ${tokenEvent.user}\n**Amount:** ${tokenEvent.amount.toString()} CLPD\n**TxHash:** ${event.transactionHash}\n**Block:** ${event.blockNumber.toString()}\n**Deposit ID:** ${matchingDeposit.id}`,
              NotificationType.SUCCESS,
              'TokensMinted Event Processed and Deposit Updated',
              undefined,
              'deposit'
            );
          } else {
            console.log(`❌ No matching deposit found for address ${tokenEvent.user} and amount ${tokenEvent.amount}`);
            await discordService.sendNotification(
              `❌ TokensMinted event processed but no matching deposit found:\n**Agent:** ${tokenEvent.agent}\n**User:** ${tokenEvent.user}\n**Amount:** ${tokenEvent.amount.toString()} CLPR2\n**TxHash:** ${event.transactionHash}\n**Block:** ${event.blockNumber.toString()}`,
              NotificationType.WARNING,
              'TokensMinted Event Processed - No Matching Deposit',
              undefined,
              'deposit'
            );
          }

        } catch (error) {
          console.error("❌ Error processing event:", error);
          await discordService.sendNotification(
            `❌ Error processing TokensMinted event: ${error}`,
            NotificationType.ERROR,
            'TokensMinted Event Processing Error',
            undefined,
            'alert'
          );
        }
      }

      await updateLastProcessedBlock(toBlock);

      fromBlock = toBlock + 1;
      toBlock = Math.min(fromBlock + MAX_BLOCK_RANGE - 1, currentBlock);
    }

  } catch (error: any) {
    console.error("❌ Error fetching and processing events:", error);
    await discordService.sendNotification(
      `❌ RPC error in processing minted token events: ${error.message || error}`,
      NotificationType.ERROR,
      'RPC Error',
      undefined,
      'alert'
    );
    process.exit(1);
  }
}

async function checkUnmintedDeposits(): Promise<void> {
  const deposits = await depositService.getAcceptedDeposits();
  const unmintedDeposits = deposits.filter(d => d.status === DepositStatus.ACCEPTED_NOT_MINTED);

  if (unmintedDeposits.length >= UNMINTED_DEPOSITS_THRESHOLD) {
    const cooldownRef = firestore.collection('notificationCooldowns').doc('unmintedDeposits');
    const cooldownDoc = await cooldownRef.get();

    const now = new Date();
    if (!cooldownDoc.exists || cooldownDoc.data()?.lastNotification.toDate() < new Date(now.getTime() - NOTIFICATION_COOLDOWN_HOURS * 60 * 60 * 1000)) {
      await discordService.sendNotification(
        `⚠️ There are ${unmintedDeposits.length} accepted deposits that have not been minted yet.`,
        NotificationType.WARNING,
        'Unminted Deposits',
        undefined,
        'alert'
      );
      await cooldownRef.set({ lastNotification: now });
    }
  }
}

async function main(): Promise<void> {
  console.log("🚀 Starting minted token events processing job...");

  try {
    await fetchAndProcessEvents();
    await checkUnmintedDeposits();
    console.log("🏁 Minted token events processing job completed");
  } catch (error) {
    console.error("❌ Unexpected error in job:", error);
    await discordService.sendNotification(
      `❌ Unexpected error in minted token events processing job: ${error}`,
      NotificationType.ERROR,
      'Error in Minted Token Events Processing Job',
      undefined,
      'alert'
    );
    process.exit(1);
  }
}

main();