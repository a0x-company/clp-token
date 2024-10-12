export type BankInfo = {
  bankId: string;
  name: string;
  accountNumber: string;
  rut: string;
  email: string;
  ownershipCheck: boolean;
};

export enum RedeemStatus {
  RECEIVED_NOT_BURNED = "received_not_burned",
  BURNED = "burned",
  REJECTED = "rejected",
}
