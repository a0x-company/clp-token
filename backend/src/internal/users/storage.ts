import { Firestore, CollectionReference, Query } from "@google-cloud/firestore";

export interface StoredUserData {
  address: string;
  email: string;
  name: string;
  profileImage: string;
  token: string;
  createdAt: number;
  updatedAt: number;
}

export class UserDataStorage {
  private firestore: Firestore;
  private userCollectionName: string = "user-data";

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  private get userCollection(): CollectionReference {
    return this.firestore.collection(this.userCollectionName);
  }

  public async addNewUser(userData: StoredUserData): Promise<StoredUserData> {
    try {
      const existingUser = await this.getUser({ address: userData.address });
      if (existingUser) {
        return existingUser;
      }

      await this.userCollection.doc(userData.address).set(userData);
      console.log(`✅ New user with address ${userData.address} added successfully`);
      return userData;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`❌ Error adding new user: ${err.message}`);
      } else {
        throw new Error(`❌ Error adding new user: Unknown error`);
      }
    }
  }

  public async getUser(param: {
    address?: string;
    email?: string;
    phoneNumber?: string;
  }): Promise<StoredUserData | null> {
    try {
      let query: Query = this.userCollection;

      if (param.address) {
        query = query.where("address", "==", param.address);
      } else if (param.email) {
        query = query.where("email", "==", param.email);
      } else if (param.phoneNumber) {
        query = query.where("phoneNumber", "==", param.phoneNumber);
      } else {
        throw new Error("At least one search parameter must be provided");
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as StoredUserData;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to get user data: ${err.message}`);
      } else {
        throw new Error("Failed to get user data: Unknown error");
      }
    }
  }

  public async updateUserData(address: string, updateData: Partial<StoredUserData>): Promise<void> {
    try {
      await this.userCollection.doc(address).set(updateData, { merge: true });
      console.log(`✅ User data updated for address ${address}`);
    } catch (error) {
      console.error(`❌ Error updating user data for address ${address}:`, error);
      throw error;
    }
  }

  public async getAllUsers(): Promise<StoredUserData[]> {
    try {
      const snapshot = await this.userCollection.get();
      return snapshot.empty ? [] : snapshot.docs.map((doc) => doc.data() as StoredUserData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(`Failed to get all user data: ${err.message}`);
      } else {
        throw new Error("Failed to get all user data: Unknown error");
      }
    }
  }
}
