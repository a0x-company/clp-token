import { Firestore, CollectionReference, Query } from "@google-cloud/firestore";
import crypto from 'crypto';


export enum BurnStatus {
  RECEIVED_NOT_BURNED = "received_not_burned",
  BURNED = "burned",
  REJECTED = "rejected"
}

export enum DepositStatus {
  PENDING = "pending",
  ACCEPTED_NOT_MINTED = "accepted_not_minted",
  ACCEPTED_MINTED = "accepted_minted",
  REJECTED = "rejected"
}

export interface BankInfo {
  id: string;
  name: string;
}

export interface BurnRequest {
  id: string;
  email: string;
  amount: number;
  status: BurnStatus;
  accountHolder: string;
  rut: string;
  accountNumber: string;
  bankId: string;
  createdAt: number;
  updatedAt: number;
  proofImageUrl?: string;
  rejectionReason?: string;
  burnTransactionHash?: string;
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
  approvedBy?: string;
  mintedAt?: number;
}

export interface ApprovalMember {
  name: string;
  passwordHash: string;
}

export class DepositDataStorage {
  private firestore: Firestore;
  private depositCollectionName: string = "deposits";
  private approvalTokenCollectionName: string = "approvalTokens";
  private approvalMembersCollectionName: string = "approvalMembers";
  private burnRequestCollectionName: string = "burnRequests";
  private banksCollectionName: string = "banks";

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  private get approvalMembersCollection(): CollectionReference {
    return this.firestore.collection(this.approvalMembersCollectionName);
  }


  private get depositCollection(): CollectionReference {
    return this.firestore.collection(this.depositCollectionName);
  }

  private get approvalTokenCollection(): CollectionReference {
    return this.firestore.collection(this.approvalTokenCollectionName);
  }

  private get burnRequestCollection(): CollectionReference {
    return this.firestore.collection(this.burnRequestCollectionName);
  }

  private get banksCollection(): CollectionReference {
    return this.firestore.collection(this.banksCollectionName);
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
    updateData: Partial<StoredDepositData>,
    memberName?: string
  ): Promise<void> {
    try {
      const dataToUpdate = { ...updateData };
      if (memberName) {
        dataToUpdate.approvedBy = memberName;
      }
      await this.depositCollection.doc(depositId).update(dataToUpdate);
      console.log(`✅ Deposit data updated for ID ${depositId}${memberName ? ` by ${memberName}` : ''}`);
    } catch (error) {
      console.error(`❌ Error updating deposit data for ID ${depositId}:`, error);
      throw error;
    }
  }

  public async updateMultipleDeposits(
    updates: { id: string; data: Partial<StoredDepositData>; memberName?: string }[]
  ): Promise<void> {
    const batch = this.firestore.batch();

    updates.forEach(({ id, data, memberName }) => {
      const docRef = this.depositCollection.doc(id);
      const dataToUpdate = { ...data, updatedAt: Date.now() };
      if (memberName) {
        dataToUpdate.approvedBy = memberName;
      }
      batch.update(docRef, dataToUpdate);
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

  public async addApprovalMember(name: string, password: string): Promise<void> {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    await this.approvalMembersCollection.add({ name, passwordHash });
  }

  public async validateApprovalMember(password: string): Promise<string | null> {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const snapshot = await this.approvalMembersCollection.where('passwordHash', '==', passwordHash).get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return snapshot.docs[0].data().name;
  }

  public async addBurnRequest(burnRequest: BurnRequest): Promise<BurnRequest> {
    try {
      await this.burnRequestCollection.doc(burnRequest.id).set(burnRequest);
      console.log(`✅ Nueva solicitud de quema con ID ${burnRequest.id} añadida exitosamente`);
      return burnRequest;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`❌ Error al añadir nueva solicitud de quema: ${err.message}`);
      } else {
        throw new Error(`❌ Error al añadir nueva solicitud de quema: Error desconocido`);
      }
    }
  }

  public async getBurnRequest(burnRequestId: string): Promise<BurnRequest | null> {
    try {
      const doc = await this.burnRequestCollection.doc(burnRequestId).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data() as BurnRequest;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Error al obtener datos de solicitud de quema: ${err.message}`);
      } else {
        throw new Error("Error al obtener datos de solicitud de quema: Error desconocido");
      }
    }
  }

  public async updateBurnRequestData(
    burnRequestId: string,
    updateData: Partial<BurnRequest>
  ): Promise<void> {
    try {
      await this.burnRequestCollection.doc(burnRequestId).update(updateData);
      console.log(`✅ Datos de solicitud de quema actualizados para ID ${burnRequestId}`);
    } catch (error) {
      console.error(`❌ Error al actualizar datos de solicitud de quema para ID ${burnRequestId}:`, error);
      throw error;
    }
  }

  public async getBurnRequestsByStatus(status: BurnStatus): Promise<BurnRequest[]> {
    try {
      const query: Query = this.burnRequestCollection.where("status", "==", status);
      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data() as BurnRequest);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Error al obtener solicitudes de quema por estado: ${err.message}`);
      } else {
        throw new Error("Error al obtener solicitudes de quema por estado: Error desconocido");
      }
    }
  }

  public async addBank(bank: BankInfo): Promise<void> {
    try {
      await this.banksCollection.doc(bank.id).set(bank);
      console.log(`✅ Nuevo banco añadido: ${bank.name}`);
    } catch (error) {
      console.error('Error al añadir banco:', error);
      throw new Error('Error al añadir banco');
    }
  }

  public async getBanks(): Promise<BankInfo[]> {
    try {
      const snapshot = await this.banksCollection.get();
      return snapshot.docs.map(doc => doc.data() as BankInfo);
    } catch (error) {
      console.error('Error al obtener bancos:', error);
      throw new Error('Error al obtener bancos');
    }
  }  
}