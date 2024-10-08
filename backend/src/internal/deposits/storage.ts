import { Firestore, CollectionReference, Query } from "@google-cloud/firestore";
import crypto from 'crypto';

export enum DepositStatus {
  PENDING = "pending",
  ACCEPTED_NOT_MINTED = "accepted_not_minted",
  ACCEPTED_MINTED = "accepted_minted",
  REJECTED = "rejected"
}

export interface ApprovalToken {
  depositId: string;
  expiresAt: number;
}
export interface StoredDepositData {
  id: string;
  email: string;
  address: string;
  amount: number;
  status: DepositStatus;
  proofImageUrl?: string;
  rejectionReason?: string;
  mintTransactionHash?: string;
  createdAt: number;
  updatedAt: number;
}

export class DepositDataStorage {
  private firestore: Firestore;
  private depositCollectionName: string = "deposits";
  private approvalTokenCollectionName: string = "approvalTokens";

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  private get depositCollection(): CollectionReference {
    return this.firestore.collection(this.depositCollectionName);
  }

  private get approvalTokenCollection(): CollectionReference {
    return this.firestore.collection(this.approvalTokenCollectionName);
  }

  public async addNewDeposit(depositData: StoredDepositData): Promise<StoredDepositData> {
    try {
      await this.depositCollection.doc(depositData.id).set(depositData);
      console.log(`✅ New deposit with ID ${depositData.id} added successfully`);
      return depositData;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`❌ Error adding new deposit: ${err.message}`);
      } else {
        throw new Error(`❌ Error adding new deposit: Unknown error`);
      }
    }
  }

  public async getDeposit(depositId: string): Promise<StoredDepositData | null> {
    try {
      const doc = await this.depositCollection.doc(depositId).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data() as StoredDepositData;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Error getting deposit data: ${err.message}`);
      } else {
        throw new Error("Error getting deposit data: Unknown error");
      }
    }
  }

  public async updateDepositData(
    depositId: string,
    updateData: Partial<StoredDepositData>
  ): Promise<void> {
    try {
      await this.depositCollection.doc(depositId).update(updateData);
      console.log(`✅ Deposit data updated for ID ${depositId}`);
    } catch (error) {
      console.error(`❌ Error updating deposit data for ID ${depositId}:`, error);
      throw error;
    }
  }


  public async updateMultipleDeposits(
    updates: { id: string; data: Partial<StoredDepositData> }[]
  ): Promise<void> {
    const batch = this.firestore.batch();

    updates.forEach(({ id, data }) => {
      const docRef = this.depositCollection.doc(id);
      batch.update(docRef, { ...data, updatedAt: Date.now() });
    });

    try {
      await batch.commit();
      console.log(`✅ Batch update completed for ${updates.length} deposits`);
    } catch (error) {
      console.error(`❌ Error in batch update:`, error);
      throw error;
    }
  }
  public async getDepositsByStatus(status: DepositStatus): Promise<StoredDepositData[]> {
    try {
      const query: Query = this.depositCollection.where("status", "==", status);
      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data() as StoredDepositData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Error getting deposits by status: ${err.message}`);
      } else {
        throw new Error("Error getting deposits by status: Unknown error");
      }
    }
  }

  public async generateApprovalToken(depositId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours validity

    try {
      await this.approvalTokenCollection.doc(token).set({
        depositId,
        expiresAt
      });
      console.log(`✅ Approval token generated for deposit ID ${depositId}`);
      return token;
    } catch (error) {
      console.error(`❌ Error generating approval token for deposit ID ${depositId}:`, error);
      throw error;
    }
  }

  public async validateApprovalToken(depositId: string, token: string): Promise<boolean> {
    try {
      const doc = await this.approvalTokenCollection.doc(token).get();
      if (!doc.exists) {
        return false;
      }

      const tokenData = doc.data() as ApprovalToken;
      if (tokenData.depositId !== depositId || tokenData.expiresAt < Date.now()) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ Error validating approval token:`, error);
      return false;
    }
  }

  public async deleteApprovalToken(token: string): Promise<void> {
    try {
      await this.approvalTokenCollection.doc(token).delete();
      console.log(`✅ Approval token deleted`);
    } catch (error) {
      console.error(`❌ Error deleting approval token:`, error);
      throw error;
    }
  }
}