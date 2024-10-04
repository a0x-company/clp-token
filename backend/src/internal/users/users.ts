import jwt from 'jsonwebtoken';
import { keccak256 } from 'js-sha3';
import { ec as EC } from 'elliptic';
import { UserDataStorage, StoredUserData } from './storage';

export class UserService {
  private ec = new EC('secp256k1');

  private storage: UserDataStorage;

  constructor(storage: UserDataStorage) {
    this.storage = storage;
  }

  private publicKeyToAddress(publicKey: string): string {
    const cleanPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
    
    let pubKeyPoint;
    try {
      pubKeyPoint = this.ec.keyFromPublic(cleanPublicKey, 'hex').getPublic();
    } catch (error) {
      console.error('Invalid public key:', error);
      throw new Error('Invalid public key');
    }

    const uncompressedPubKey = pubKeyPoint.encode('hex').slice(2); // remove '04' prefix
    const hash = keccak256(Buffer.from(uncompressedPubKey, 'hex'));
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

  public async saveUser(token: string): Promise<StoredUserData> {
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
  
    return await this.storage.addNewUser(userData);
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

  public async getUser(param: { address?: string; email?: string; token?: string }): Promise<StoredUserData | null> {
    if (param.token) {
      const decodedToken = this.decodeToken(param.token);
      const address = this.publicKeyToAddress(decodedToken.wallets[0].public_key);
      return await this.storage.getUser({ address });
    } else {
      return await this.storage.getUser(param);
    }
  }

  public getAddressFromToken(token: string): string {
    const decodedToken = this.decodeToken(token);
    return this.publicKeyToAddress(decodedToken.wallets[0].public_key);
  }
}