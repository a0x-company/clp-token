import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from 'uuid';
import { DepositDataStorage, StoredDepositData, DepositStatus } from "./storage";
import { DiscordNotificationService, NotificationType } from "../notifications/discord";

export class DepositService {
  private storage: DepositDataStorage;
  private bucketStorage: Storage;
  private discordNotificationService: DiscordNotificationService;

  constructor(
    firestore: Firestore,
    bucketStorage: Storage,
    discordWebhookUrl: string
  ) {
    this.storage = new DepositDataStorage(firestore);
    this.bucketStorage = bucketStorage;
    this.discordNotificationService = new DiscordNotificationService(discordWebhookUrl);
  }

  public async registerDeposit(
    email: string,
    address: string,
    amount: number
  ): Promise<StoredDepositData> {
    const depositData: StoredDepositData = {
      id: uuidv4(),
      email,
      address,
      amount,
      status: DepositStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = await this.storage.addNewDeposit(depositData);
    console.log(`✅ New deposit registered with ID ${result.id}`);
    return result;
  }

  public async uploadProofOfDeposit(
    depositId: string,
    proofImage: Buffer,
    fileName: string
  ): Promise<void> {
    const bucket = this.bucketStorage.bucket("deposit-proofs");
    const file = bucket.file(`${depositId}/${fileName}`);

    await file.save(proofImage);

    await this.storage.updateDepositData(depositId, {
      proofImageUrl: `gs://deposit-proofs/${depositId}/${fileName}`,
      updatedAt: Date.now(),
    });

    await this.discordNotificationService.sendNotification(
      `A new deposit proof has been uploaded for ID: ${depositId}. Please verify it.`,
      NotificationType.INFO,
      "New Deposit Proof"
    );
    console.log(`📤 Proof of deposit uploaded for ID ${depositId}`);
  }

  public async approveDeposit(depositId: string): Promise<void> {
    await this.storage.updateDepositData(depositId, {
      status: DepositStatus.ACCEPTED_NOT_MINTED,
      updatedAt: Date.now(),
    });

    const deposit = await this.storage.getDeposit(depositId);
    if (deposit) {
      await this.discordNotificationService.sendNotification(
        `Deposit with ID ${depositId} has been approved. Amount: ${deposit.amount} for address ${deposit.address}`,
        NotificationType.SUCCESS,
        "Deposit Approved"
      );
    }
    console.log(`✅ Deposit approved: ID ${depositId}`);
  }

  public async markDepositAsMinted(depositId: string): Promise<void> {
    await this.storage.updateDepositData(depositId, {
      status: DepositStatus.ACCEPTED_MINTED,
      updatedAt: Date.now(),
    });
    console.log(`🪙 Deposit marked as minted: ID ${depositId}`);
  }

  public async rejectDeposit(depositId: string, reason: string): Promise<void> {
    await this.storage.updateDepositData(depositId, {
      status: DepositStatus.REJECTED,
      rejectionReason: reason,
      updatedAt: Date.now(),
    });
    console.log(`❌ Deposit rejected: ID ${depositId}`);
  }

  public async getDeposit(depositId: string): Promise<StoredDepositData | null> {
    return await this.storage.getDeposit(depositId);
  }

  public async getDepositsByStatus(status: DepositStatus): Promise<StoredDepositData[]> {
    return await this.storage.getDepositsByStatus(status);
  }

  public async getPendingDeposits(): Promise<StoredDepositData[]> {
    return this.getDepositsByStatus(DepositStatus.PENDING);
  }

  public async getAcceptedDeposits(): Promise<StoredDepositData[]> {
    const notMinted = await this.getDepositsByStatus(DepositStatus.ACCEPTED_NOT_MINTED);
    const minted = await this.getDepositsByStatus(DepositStatus.ACCEPTED_MINTED);
    return [...notMinted, ...minted];
  }

  public async getRejectedDeposits(): Promise<StoredDepositData[]> {
    return this.getDepositsByStatus(DepositStatus.REJECTED);
  }
}