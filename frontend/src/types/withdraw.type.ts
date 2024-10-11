export type BankInfo = {
  bankName: string;
  name: string;
  accountNumber: string;
  accountType: string;
  email: string;
};

export enum RedeemStatus {
  PENDING = "pending",
  ACCEPTED_NOT_BURNED = "accepted_not_burned",
  ACCEPTED_BURNED = "accepted_burned",
  REJECTED = "rejected",
}
