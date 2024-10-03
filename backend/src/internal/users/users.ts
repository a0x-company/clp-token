import jwt from 'jsonwebtoken';
import { keccak256 } from 'js-sha3';
import { UserDataStorage, StoredUserData } from './storage';

export class UserService {
  private storage: UserDataStorage;

  constructor(storage: UserDataStorage) {
    this.storage = storage;
  }

  private publicKeyToAddress(publicKey: string): string {
    const cleanPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
    
    if (cleanPublicKey.length !== 128) {
      throw new Error('La clave pública debe tener 64 bytes');
    }
    
    const hash = keccak256(Buffer.from(cleanPublicKey, 'hex'));
    const address = '0x' + hash.slice(-40);
    
    return address.toLowerCase();
  }

  private decodeToken(token: string): any {
    const decodedToken = jwt.decode(token);
    if (!decodedToken) {
      throw new Error("Token inválido");
    }
    return decodedToken;
  }

  public async saveUser(token: string): Promise<void> {
    const decodedToken = this.decodeToken(token);
    const userData: StoredUserData = {
      address: this.publicKeyToAddress(decodedToken.wallets[0].public_key),
      email: decodedToken.email,
      name: decodedToken.name,
      profileImage: decodedToken.profileImage,
      token: token,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.storage.addNewUser(userData);
  }

  public async updateUser(token: string): Promise<void> {
    const decodedToken = this.decodeToken(token);
    const updatedData: Partial<StoredUserData> = {
      email: decodedToken.email,
      name: decodedToken.name,
      profileImage: decodedToken.profileImage,
      token: token,
      updatedAt: Date.now(),
    };

    await this.storage.updateUserData(this.publicKeyToAddress(decodedToken.wallets[0].public_key), updatedData);
  }

  public async getUser(param: { address?: string; email?: string }): Promise<StoredUserData | null> {
    return await this.storage.getUser(param);
  }

  public getAddressFromToken(token: string): string {
    const decodedToken = this.decodeToken(token);
    return this.publicKeyToAddress(decodedToken.wallets[0].public_key);
  }
}