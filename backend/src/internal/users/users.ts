import jwt from "jsonwebtoken";
import { keccak256 } from "js-sha3";
import { ec as EC } from "elliptic";
import { v4 as uuidv4 } from "uuid";
import { UserDataStorage, StoredUserData } from "./storage";
import { ethers } from "ethers";
import { createCipheriv, randomBytes } from "crypto";
import { ENCRYPTION_KEY } from "@internal/config";

type LoginUserInputDto = {
  phoneNumber: string;
};

export class UserService {
  private ec = new EC("secp256k1");

  private storage: UserDataStorage;

  constructor(storage: UserDataStorage) {
    this.storage = storage;
  }

  private publicKeyToAddress(publicKey: string): string {
    const cleanPublicKey = publicKey.startsWith("0x") ? publicKey.slice(2) : publicKey;

    let pubKeyPoint;
    try {
      pubKeyPoint = this.ec.keyFromPublic(cleanPublicKey, "hex").getPublic();
    } catch (error) {
      console.error("Invalid public key:", error);
      throw new Error("Invalid public key");
    }

    const uncompressedPubKey = pubKeyPoint.encode("hex").slice(2); // remove '04' prefix
    const hash = keccak256(Buffer.from(uncompressedPubKey, "hex"));
    const address = "0x" + hash.slice(-40);

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
      updatedAt: Date.now(),
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

    await this.storage.updateUserData(
      this.publicKeyToAddress(decodedToken.wallets[0].public_key),
      updatedData
    );
  }

  public async getUser(param: {
    address?: string;
    email?: string;
    token?: string;
  }): Promise<StoredUserData | null> {
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

  public async login(input: LoginUserInputDto): Promise<void> {
    const { phoneNumber } = input;
    const user = await this.storage.getUser({ phoneNumber });

    // if user does not exist, create a new one
    if (!user) {
      const { address: evmAddress, privateKey: evmPrivateKey } = this.generateEvmWallet();
      const newUser = this.setUser(phoneNumber);
      newUser.internalAddresses = {
        evmAddress: evmAddress,
      };
      newUser.internalPrivateKeys = {
        evmPrivateKey: this.encrypt(evmPrivateKey),
      };
      newUser.address = evmAddress;
      newUser.phoneNumber = phoneNumber;

      await this.storage.addNewUser(newUser);

      // await this.phoneNumberManager.sendSixCharactersCode(phoneNumber, newUser.sixCharacters || "");

      return;
    }

    const updatedUser = this.setUser(phoneNumber);
    await this.storage.updateUserData(user.address, updatedUser);

    // await this.phoneNumberManager.sendSixCharactersCode(phoneNumber, updatedUser.sixCharacters || "");
  }

  private setUser(phoneNumber: string, user?: any): any {
    const createdAt = user?.createdAt;
    if (createdAt) {
      return {
        phoneNumber,
        token: this.generateAuthCode(),
        sixCharacters: this.generateSixCharactersCode(),
        updatedAt: new Date(),
        createdAt,
      };
    }

    return {
      phoneNumber,
      token: this.generateAuthCode(),
      sixCharacters: this.generateSixCharactersCode(),
      updatedAt: new Date(),
      createdAt: new Date(),
    };
  }

  private encrypt(text: string): string {
    if (!ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY env value is not defined");
    }

    const generatedEncryptionKey = this.generateEncryptionKey(ENCRYPTION_KEY as string);

    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", generatedEncryptionKey, iv);

    let encrypted = cipher.update(text, "utf-8", "hex");
    encrypted += cipher.final("hex");

    const ivHex = iv.toString("hex");
    return `${encrypted}-${ivHex}`;
  }

  private generateEncryptionKey(originalKey: string) {
    let newKey = "";
    for (let i = 0; i < originalKey.length; i += 2) {
      newKey += originalKey.charAt(i);
    }
    return newKey;
  }

  private generateAuthCode(): string {
    return uuidv4();
  }

  private generateEvmWallet(): { address: string; privateKey: string } {
    const newWallet = ethers.Wallet.createRandom();

    return {
      address: newWallet.address,
      privateKey: newWallet.privateKey,
    };
  }

  private generateSixCharactersCode(): string {
    const characters = "abcdefghijklmnopqrstuvwxyz".toUpperCase();
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
}
