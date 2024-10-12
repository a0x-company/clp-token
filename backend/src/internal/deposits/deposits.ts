import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from 'uuid';
import { DepositDataStorage, StoredDepositData, DepositStatus, BurnStatus, BankInfo, BurnRequest } from "./storage";
import { DiscordNotificationService, NotificationType, EmailNotificationService , EmailType} from "../notifications";
import { fromBuffer } from 'pdf2pic';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { StoredUserData } from "@internal/users";

export class DepositService {
  private storage: DepositDataStorage;
  private bucketStorage: Storage;
  private discordNotificationService: DiscordNotificationService;
  private emailNotificationService: EmailNotificationService;  
  private bucketName: string = 'deposit-proofs';


  constructor(
    firestore: Firestore,
    bucketStorage: Storage,
    discordWebhookUrl: string,
    resendApiKey: string
  ) {
    this.storage = new DepositDataStorage(firestore);
    this.bucketStorage = bucketStorage;
    this.discordNotificationService = new DiscordNotificationService(discordWebhookUrl);
    this.emailNotificationService = new EmailNotificationService(resendApiKey);
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

    await this.emailNotificationService.sendNotification(
      user.email,
      EmailType.NEW_DEPOSIT,
      { amount, userName: user.name, depositId: depositData.id }
    );    

    return result;
  }

  public async requestBurn(
    user: StoredUserData,
    amount: number,
    accountHolder: string,
    rut: string,
    accountNumber: string,
    bankId: string,
    email: string
  ): Promise<BurnRequest> {
    const burnRequest: BurnRequest = {
      id: uuidv4(),
      userEmail: user.email,
      email,
      amount,
      status: BurnStatus.RECEIVED_NOT_BURNED,
      accountHolder,
      rut,
      accountNumber,
      bankId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  
    const result = await this.storage.addBurnRequest(burnRequest);
    console.log(`✅ New burn request registered with ID ${result.id}`);
  
    const redeemTransaction = {
      "version": "1.0",
      "chainId": "8453",
      "createdAt": Date.now(),
      "meta": {
        "name": "Redeem Transaction",
        "description": "Redeem transaction for burn request",
        "txBuilderVersion": "1.17.0",
        "createdFromSafeAddress": "0x5B753Da5d8c874E9313Be91fbd822979Cc7F3F88",
        "createdFromOwnerAddress": "",
        "checksum": ""
      },
      "transactions": [
        {
          "to": "0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1",
          "value": "0",
          "data": null,
          "contractMethod": {
            "inputs": [
              { "internalType": "uint256", "name": "amount", "type": "uint256" },
              { "internalType": "address", "name": "recipient", "type": "address" }
            ],
            "name": "redeem",
            "payable": false
          },
          "contractInputsValues": {
            "amount": amount.toString(),
            "recipient": user.address
          }
        }
      ]
    };
  
    const redeemTransactionJson = JSON.stringify(redeemTransaction, null, 2);
  
    const fileName = `burn-requests/${result.id}/redeem-transaction.json`;
    const file = this.bucketStorage.bucket(this.bucketName).file(fileName);
    await file.save(redeemTransactionJson, {
      metadata: { contentType: 'application/json' },
    });
  
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
  
    await this.discordNotificationService.sendNotification(
      `New burn request registered:\nAmount: ${amount}\nUser Name: ${user.name}\nUser Email: ${user.email}\nBurn Request Email: ${email}\nBurn Request ID: ${burnRequest.id}\n\nRedeem Transaction JSON: [Descargar Archivo](${url})`,
      NotificationType.INFO,
      "New Burn Request"
    );
  
    await this.emailNotificationService.sendNotification(
      user.email,
      EmailType.NEW_BURN_REQUEST,
      { amount, userName: user.name, burnRequestId: burnRequest.id, redeemTransactionUrl: url }
    );    
  
    return result;
  }
  
  public async approveBurnRequest(burnRequestId: string, transactionHash: string): Promise<void> {
    const burnRequest = await this.storage.getBurnRequest(burnRequestId);
    if (!burnRequest) {
      throw new Error(`Burn request with ID ${burnRequestId} not found`);
    }
  
    await this.storage.updateBurnRequestData(burnRequestId, {
      status: BurnStatus.BURNED,
      burnTransactionHash: transactionHash,
      updatedAt: Date.now(),
    });
    console.log(`🔥 Burn request marked as burned: ID ${burnRequestId}, Transaction Hash: ${transactionHash}`);
  }

  public async rejectBurnRequest(burnRequestId: string, reason: string): Promise<void> {
    await this.storage.updateBurnRequestData(burnRequestId, {
      status: BurnStatus.REJECTED,
      rejectionReason: reason,
      updatedAt: Date.now(),
    });

    const burnRequest = await this.storage.getBurnRequest(burnRequestId);
    if (burnRequest) {
      await this.discordNotificationService.sendNotification(
        `Burn request with ID ${burnRequestId} has been rejected. Reason: ${reason}`,
        NotificationType.ERROR,
        "Burn Request Rejected"
      );
  
      await this.emailNotificationService.sendNotification(
        burnRequest.email,
        EmailType.BURN_REQUEST_REJECTED,
        { amount: burnRequest.amount, burnRequestId: burnRequest.id, reason }
      );
    }
    console.log(`❌ Burn request rejected: ID ${burnRequestId}`);
  }
 
  public async uploadBurnProof(
    burnRequestId: string,
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
  
    const pngFile = bucket.file(`burn-proofs/${burnRequestId}/proof.png`);
    await pngFile.save(pngBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });
  
    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/burn-proofs/${burnRequestId}/proof.png`;
  
    await this.storage.updateBurnRequestData(burnRequestId, {
      proofImageUrl: publicUrl,
      updatedAt: Date.now(),
    });
  
    console.log(`📤 Proof of burn uploaded for ID ${burnRequestId}`);
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

      await this.emailNotificationService.sendNotification(
        deposit.email,
        EmailType.DEPOSIT_APPROVED,
        { amount: deposit.amount, depositId: deposit.id }
      );
    }
    console.log(`✅ Deposit approved: ID ${depositId} by ${memberName}`);
    return memberName;
  }

  public async markDepositAsMinted(depositId: string, transactionHash: string): Promise<void> {
    const deposit = await this.storage.getDeposit(depositId);
    if (!deposit) {
      throw new Error(`Deposit with ID ${depositId} not found`);
    }
  
    await this.storage.updateDepositData(depositId, {
      status: DepositStatus.ACCEPTED_MINTED,
      mintTransactionHash: transactionHash,
      updatedAt: Date.now(),
    });
  
    await this.emailNotificationService.sendNotification(
      deposit.email,
      EmailType.TOKENS_MINTED,
      {
        amount: deposit.amount,
        depositId: deposit.id,
        userName: deposit.email.split('@')[0],
        transactionHash
      }
    );
  
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

    const deposit = await this.storage.getDeposit(depositId);
    if (deposit) {
      await this.discordNotificationService.sendNotification(
        `Deposit with ID ${depositId} has been rejected by ${memberName}. Reason: ${reason}`,
        NotificationType.ERROR,
        "Deposit Rejected"
      );
  
      await this.emailNotificationService.sendNotification(
        deposit.email,
        EmailType.DEPOSIT_REJECTED,
        { amount: deposit.amount, depositId: deposit.id, reason }
      );
    }
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

  public async getBurnRequestsByStatus(status: BurnStatus): Promise<BurnRequest[]> {
    return await this.storage.getBurnRequestsByStatus(status);
  }

  public async addBank(name: string): Promise<void> {
    const bank: BankInfo = {
      id: uuidv4(),
      name
    };
    await this.storage.addBank(bank);
  }

  public async getBanks(): Promise<BankInfo[]> {
    return await this.storage.getBanks();
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