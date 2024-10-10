"use client";
// react
import React, { useEffect, useState } from "react";

// components
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { LoadingSpinner } from "../ui/spinner";

// translations
import { useTranslations } from "next-intl";

// axios
import axios from "axios";

// web3Auth
import { web3AuthInstance } from "@/provider/WagmiConfig";

// icons
import { FlagIcon } from "react-flag-kit";

interface WithdrawOrderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setWithdrawStatus: React.Dispatch<
    React.SetStateAction<"processing" | "initiated" | "completed" | null>
  >;
  amount: string;
}

interface WithdrawFormState {
  amount: string;
  bankAccount: string;
  accountHolder: string;
  complianceCheck: boolean;
  ownershipCheck: boolean;
}

const WithdrawOrder: React.FC<WithdrawOrderProps> = ({
  open,
  setOpen,
  setWithdrawStatus,
  amount,
}) => {
  const t = useTranslations("withdraw");
  const [formState, setFormState] = useState<WithdrawFormState>({
    amount: amount || "0",
    bankAccount: "",
    accountHolder: "",
    complianceCheck: false,
    ownershipCheck: false,
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setFormState((prev) => ({ ...prev, amount: amount }));
  }, [amount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormState((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "amount") {
      let newValue = value.replace(/[^0-9]/g, "");
      if (newValue.length > 1 && newValue.startsWith("0")) {
        newValue = newValue.replace(/^0+/, "");
      }
      setFormState((prev) => ({ ...prev, [name]: newValue }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    console.log("Formulario:", formState);
    const userInfo = await web3AuthInstance.getUserInfo();
    const idToken = userInfo?.idToken;
    try {
      const response = await axios.post("/api/create-withdraw-order", formState, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      if (response.status === 201 || response.status === 200) {
        setFormState({
          amount: "",
          bankAccount: "",
          accountHolder: "",
          complianceCheck: false,
          ownershipCheck: false,
        });
        setOpen(false);
        setWithdrawStatus("processing");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl bg-white text-black font-helvetica rounded-3xl border-2 border-black">
        <DialogHeader>
          <DialogTitle className="text-black text-2xl font-bold">
            {t("createWithdrawOrder")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid items-center relative w-full gap-1.5">
              <label htmlFor="amount">{t("amount")}</label>
              <div className="flex justify-start items-center gap-2">
                <p className="text-[28px]">{formState.amount} CLP</p>
                <FlagIcon
                  code={"CL"}
                  size={32}
                  className="rounded-md opacity-75 border border-black"
                />
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="bankAccount">{t("bankAccount")}</label>
              <Input
                type="text"
                id="bankAccount"
                name="bankAccount"
                value={formState.bankAccount}
                onChange={handleInputChange}
                placeholder={t("bankAccountPlaceholder")}
                className="bg-white text-black"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="accountHolder">{t("accountHolder")}</label>
              <Input
                type="text"
                id="accountHolder"
                name="accountHolder"
                value={formState.accountHolder}
                onChange={handleInputChange}
                placeholder={t("accountHolderPlaceholder")}
                className="bg-white text-black"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ownershipCheck"
                name="ownershipCheck"
                checked={formState.ownershipCheck}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, ownershipCheck: checked as boolean }))
                }
              />
              <label
                htmlFor="ownershipCheck"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("ownershipCheck")}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="complianceCheck"
                name="complianceCheck"
                checked={formState.complianceCheck}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, complianceCheck: checked as boolean }))
                }
              />
              <label
                htmlFor="complianceCheck"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("complianceCheck")}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-black text-white"
              type="submit"
              disabled={!formState.complianceCheck || !formState.ownershipCheck}
            >
              {loading ? <LoadingSpinner /> : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawOrder;
