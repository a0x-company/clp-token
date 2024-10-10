import 'module-alias/register';

import { ethers } from 'ethers';
import { Firestore } from '@google-cloud/firestore';
import { Storage } from "@google-cloud/storage";
import { DepositService } from '@internal/deposits';
import { config } from '@internal';
import { DiscordNotificationService, NotificationType } from '@internal/notifications';

if (!config.PROJECT_ID || !config.RPC_URL || !config.DISCORD_WEBHOOK_URL || !config.RESEND_API_KEY) {
  throw new Error("❌ Required environment variables are missing");
}

const MAX_BLOCK_RANGE = 5000;
const TOKEN_ADDRESS = '0xe97d2Ed8261b6aeE31fD216916E2FcE7252F44ed';
const ABI = ['event TokensMinted(address indexed agent, address indexed user, uint256 amount)'];
const INITIAL_BLOCK = 20856115;

const firestore = new Firestore({ projectId: config.PROJECT_ID, databaseId: config.DATABASE_ENV });
const discordService = new DiscordNotificationService(config.DISCORD_WEBHOOK_URL);
const depositService = new DepositService(firestore, new Storage(), config.DISCORD_WEBHOOK_URL, config.RESEND_API_KEY);

interface TokenMintedEvent {
  agent: string;
  user: string;
  amount: number;
}

async function getLastProcessedBlock(): Promise<number> {
  const docRef = firestore.collection('blockTracking').doc('CLPR2TokensMinted');
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
  const docRef = firestore.collection('blockTracking').doc('CLPR2TokensMinted');
  await docRef.set({ lastBlock: blockNumber }, { merge: true });
  console.log(`✅ Updated last processed block to: ${blockNumber}`);
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

      for (const [index, event] of events.entries()) {
        try {
          const parsedEvent = contract.interface.parseLog(event);
          if (parsedEvent === null) {
            console.error(`❌ Failed to parse event at index ${index}`);
            await discordService.sendNotification(
              `❌ Failed to parse TokensMinted event at index ${index}`,
              NotificationType.ERROR,
              'TokensMinted Event Parsing Error'
            );
            continue;
          }

          const { agent, user, amount } = parsedEvent.args;

          const tokenEvent: TokenMintedEvent = {
            agent,
            user,
            amount: Number(ethers.formatUnits(amount, 18)),
          };

          console.log(`\n🔹 Event ${index + 1}:`);
          console.log(`  Agent: ${tokenEvent.agent}`);
          console.log(`  User: ${tokenEvent.user}`);
          console.log(`  Amount: ${tokenEvent.amount} CLPR2`);
          console.log(`  TxHash: ${event.transactionHash}`);
          console.log(`  Block: ${event.blockNumber}`);
          console.log("--------------------------------------------");

          // Buscar el depósito correspondiente
          const deposits = await depositService.getAcceptedDeposits();
          const matchingDeposit = deposits.find(d => 
            d.address.toLowerCase() === tokenEvent.user.toLowerCase() && 
            d.amount === tokenEvent.amount
          );

          if (matchingDeposit) {
            // Marcar el depósito como minteado
            await depositService.markDepositAsMinted(matchingDeposit.id, event.transactionHash);
            console.log(`✅ Deposit ${matchingDeposit.id} marked as minted`);

            await discordService.sendNotification(
              `✅ TokensMinted event processed and deposit updated:\n**Agent:** ${tokenEvent.agent}\n**User:** ${tokenEvent.user}\n**Amount:** ${tokenEvent.amount} CLPR2\n**TxHash:** ${event.transactionHash}\n**Block:** ${event.blockNumber}\n**Deposit ID:** ${matchingDeposit.id}`,
              NotificationType.SUCCESS,
              'TokensMinted Event Processed and Deposit Updated'
            );
          } else {
            console.log(`❌ No matching deposit found for address ${tokenEvent.user} and amount ${tokenEvent.amount}`);
            await discordService.sendNotification(
              `❌ TokensMinted event processed but no matching deposit found:\n**Agent:** ${tokenEvent.agent}\n**User:** ${tokenEvent.user}\n**Amount:** ${tokenEvent.amount} CLPR2\n**TxHash:** ${event.transactionHash}\n**Block:** ${event.blockNumber}`,
              NotificationType.WARNING,
              'TokensMinted Event Processed - No Matching Deposit'
            );
          }

        } catch (error) {
          console.error("❌ Error processing the event:", error);
          await discordService.sendNotification(
            `❌ Error processing TokensMinted event: ${error}`,
            NotificationType.ERROR,
            'TokensMinted Event Processing Error'
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
      `❌ RPC Error in token minted event processing: ${error.message || error}`,
      NotificationType.ERROR,
      'RPC Error'
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  console.log("🚀 Starting token minted event processing job...");

  try {
    await fetchAndProcessEvents();
    console.log("🏁 Token minted event processing job completed");
  } catch (error) {
    console.error("❌ Unexpected error in the job:", error);
    await discordService.sendNotification(
      `❌ Unexpected error in token minted event processing job: ${error}`,
      NotificationType.ERROR,
      'Token Minted Event Processing Job Error'
    );
    process.exit(1);
  }
}

main();