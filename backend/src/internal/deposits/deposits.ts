import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from 'uuid';
import { DepositDataStorage, StoredDepositData, DepositStatus } from "./storage";
import { DiscordNotificationService, NotificationType } from "../notifications/discord";
import { fromBuffer } from 'pdf2pic';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { StoredUserData } from "@internal/users";

export class DepositService {
  private storage: DepositDataStorage;
  private bucketStorage: Storage;
  private discordNotificationService: DiscordNotificationService;
  private bucketName: string = 'deposit-proofs';


  constructor(
    firestore: Firestore,
    bucketStorage: Storage,
    discordWebhookUrl: string
  ) {
    this.storage = new DepositDataStorage(firestore);
    this.bucketStorage = bucketStorage;
    this.discordNotificationService = new DiscordNotificationService(discordWebhookUrl);
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const [bucketExists] = await this.bucketStorage.bucket(this.bucketName).exists();
      if (!bucketExists) {
        await this.bucketStorage.createBucket(this.bucketName);
        console.log(`Bucket ${this.bucketName} created.`);
      } else {
        console.log(`Bucket ${this.bucketName} already exists.`);
      }
    } catch (error) {
      console.error(`Error checking/creating bucket ${this.bucketName}:`, error);
      throw error;
    }
  }

  public async registerDeposit(
    user: StoredUserData,
    amount: number
  ): Promise<StoredDepositData> {
    const depositData: StoredDepositData = {
      id: uuidv4(),
      email: user.email,
      address: user.address,
      amount,
      status: DepositStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = await this.storage.addNewDeposit(depositData);
    console.log(`✅ New deposit registered with ID ${result.id}`);
    await this.discordNotificationService.sendNotification(
      `New deposit registered:\nAmount: ${amount}\nUser Name: ${user.name}\nEmail: ${user.email}\nDeposit ID: ${depositData.id}\n`,
      NotificationType.INFO,
      "New Deposit"
    );

    return result;
  }

  public async uploadProofOfDeposit(
    depositId: string,
    proofFile: Buffer,
    fileName: string
  ): Promise<void> {

    await this.ensureBucketExists();

    const bucket = this.bucketStorage.bucket(this.bucketName);
    const fileExtension = path.extname(fileName).toLowerCase();
    
    let pngBuffer: Buffer;
    if (fileExtension === '.pdf') {
      const options = {
        density: 100,
        format: "png",
        width: 1000,
        height: 1000,
        savePath: "/tmp",
        type: "GraphicsMagick"
      };

      const storeAsImage = fromBuffer(proofFile, options);

      try {
        const result = await storeAsImage(1);

        if (!result.path) {
          throw new Error("Failed to convert PDF to image");
        }

        pngBuffer = await fs.readFile(result.path);
      } catch (error) {
        console.error("Error converting PDF to PNG:", error);
        throw error;
      }
    } else {
      pngBuffer = await sharp(proofFile).png().toBuffer();
    }

    const pngFile = bucket.file(`${depositId}/proof.png`);
    await pngFile.save(pngBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${depositId}/proof.png`;

    await this.storage.updateDepositData(depositId, {
      proofImageUrl: publicUrl,
      updatedAt: Date.now(),
    });

    await this.discordNotificationService.sendNotification(
      `A new deposit proof has been uploaded for ID: ${depositId}.\n\nProof Image:`,
      NotificationType.INFO,
      "New Deposit Proof",
      publicUrl
    );
  
    const approvalToken = await this.storage.generateApprovalToken(depositId);
    const approvalLink = `https://development-clpa-api-claucondor-61523929174.us-central1.run.app/deposits/approval-form/${depositId}/${approvalToken}`;

    await this.discordNotificationService.sendNotification(
      `New deposit proof uploaded for ID: ${depositId}.\n\nProof Image: ${publicUrl}\n\nApproval Link: ${approvalLink}`,
      NotificationType.WARNING,
      "New Deposit Proof - Action Required"
    );
    console.log(`📤 Proof of deposit uploaded for ID ${depositId}`);

  }

  public async approveDeposit(depositId: string, token: string, password: string): Promise<string> {
    const memberName = await this.validateApprovalMember(password);
    if (!memberName) {
      throw new Error("Invalid approval password");
    }
    if (!(await this.storage.validateApprovalToken(depositId, token))) {
      throw new Error("Invalid or expired approval token");
    }

    await this.storage.updateDepositData(depositId, {
      status: DepositStatus.ACCEPTED_NOT_MINTED,
      updatedAt: Date.now(),
      approvedBy: memberName
    });

    await this.storage.deleteApprovalToken(token);

    const deposit = await this.storage.getDeposit(depositId);
    if (deposit) {
      await this.discordNotificationService.sendNotification(
        `Deposit with ID ${depositId} has been approved by ${memberName}. Amount: ${deposit.amount} for address ${deposit.address}`,
        NotificationType.SUCCESS,
        "Deposit Approved"
      );
    }
    console.log(`✅ Deposit approved: ID ${depositId} by ${memberName}`);
    return memberName;
  }

  public async markDepositAsMinted(depositId: string, transactionHash: string): Promise<void> {
    await this.storage.updateDepositData(depositId, {
      status: DepositStatus.ACCEPTED_MINTED,
      mintTransactionHash: transactionHash,
      updatedAt: Date.now(),
    });
    console.log(`🪙 Deposit marked as minted: ID ${depositId}, Transaction Hash: ${transactionHash}`);
  }

  public async markMultipleDepositsAsMinted(deposits: { id: string; transactionHash: string }[]): Promise<void> {
    const updates = deposits.map(({ id, transactionHash }) => ({
      id,
      data: {
        status: DepositStatus.ACCEPTED_MINTED,
        mintTransactionHash: transactionHash,
      },
    }));

    await this.storage.updateMultipleDeposits(updates);
    console.log(`🪙 Batch minting completed for ${deposits.length} deposits`);
  }

  public async rejectDeposit(depositId: string, reason: string, token: string, password: string): Promise<string> {
    const memberName = await this.storage.validateApprovalMember(password);
    if (!memberName) {
      throw new Error("Invalid approval password");
    }
    if (!(await this.storage.validateApprovalToken(depositId, token))) {
      throw new Error("Invalid or expired approval token");
    }

    await this.storage.updateDepositData(depositId, {
      status: DepositStatus.REJECTED,
      rejectionReason: reason,
      updatedAt: Date.now(),
    });

    await this.storage.deleteApprovalToken(token);

    await this.discordNotificationService.sendNotification(
      `Deposit with ID ${depositId} has been rejected by ${memberName}. Reason: ${reason}`,
      NotificationType.ERROR,
      "Deposit Rejected"
    );
    console.log(`❌ Deposit rejected: ID ${depositId} by ${memberName}`);
    return memberName;
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

  public async validateApprovalToken(depositId: string, token: string): Promise<boolean> {
    return await this.storage.validateApprovalToken(depositId, token);
  }

  public async validateApprovalMember(password: string): Promise<string | null> {
    return await this.storage.validateApprovalMember(password);
  }

  public async addApprovalMember(name: string, password: string): Promise<void> {
    try {
      await this.storage.addApprovalMember(name, password);
      console.log(`✅ New approval member added: ${name}`);
      await this.discordNotificationService.sendNotification(
        `New approval member added: ${name}`,
        NotificationType.INFO,
        "New Approval Member"
      );
    } catch (error) {
      console.error('Error adding approval member:', error);
      throw new Error('Failed to add approval member');
    }
  }
}