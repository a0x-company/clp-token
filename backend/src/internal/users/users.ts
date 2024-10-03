import jwt from 'jsonwebtoken';
import { UserDataStorage, StoredUserData } from './storage';

export class User {
  private token: string;
  private decodedToken: any;
  private storage: UserDataStorage;

  constructor(token: string, storage: UserDataStorage) {
    this.token = token;
    this.decodedToken = jwt.decode(token);
    this.storage = storage;

    if (!this.decodedToken) {
      throw new Error("Invalid token");
    }
  }

  public async save(): Promise<void> {
    const userData: StoredUserData = {
      address: this.decodedToken.wallets[0].public_key,
      email: this.decodedToken.email,
      name: this.decodedToken.name,
      profileImage: this.decodedToken.profileImage,
      token: this.token,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.storage.addNewUser(userData);
  }

  public async update(): Promise<void> {
    const updatedData: Partial<StoredUserData> = {
      email: this.decodedToken.email,
      name: this.decodedToken.name,
      profileImage: this.decodedToken.profileImage,
      token: this.token,
      updatedAt: Date.now(),
    };

    await this.storage.updateUserData(this.decodedToken.wallets[0].public_key, updatedData);
  }

  public static async getUser(storage: UserDataStorage, param: { address?: string; email?: string }): Promise<User | null> {
    const userData = await storage.getUser(param);
    if (userData) {
      return new User(userData.token, storage);
    }
    return null;
  }

  public getAddress(): string {
    return this.decodedToken.wallets[0].public_key;
  }

  public getEmail(): string {
    return this.decodedToken.email;
  }

  public getName(): string {
    return this.decodedToken.name;
  }

  public getProfileImage(): string {
    return this.decodedToken.profileImage;
  }
}