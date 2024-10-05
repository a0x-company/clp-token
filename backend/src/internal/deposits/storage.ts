import { Firestore, CollectionReference, Query } from "@google-cloud/firestore";

export enum DepositStatus {
  PENDING = "pending",
  ACCEPTED_NOT_MINTED = "accepted_not_minted",
  ACCEPTED_MINTED = "accepted_minted",
  REJECTED = "rejected"
}

export interface StoredDepositData {
  id: string;
  email: string;
  address: string;
  amount: number;
  status: DepositStatus;
  proofImageUrl?: string;
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}

export class DepositDataStorage {
  private firestore: Firestore;
  private depositCollectionName: string = "deposits";

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  private get depositCollection(): CollectionReference {
    return this.firestore.collection(this.depositCollectionName);
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
}