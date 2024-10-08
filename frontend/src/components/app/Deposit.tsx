"use client";
// react
import { useState } from "react";

//components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// icons
import { InfoIcon } from "lucide-react";
import { FlagIcon, FlagIconCode } from "react-flag-kit";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { useTranslations } from "next-intl";
import CreateOrder from "./CreateOrder";
import { cn } from "@/lib/utils";

const currencies = {
  CLP: { name: "Peso Chileno", code: "CL" },
};

const bankInfo = {
  name: "Banco Santander",
  accountType: "Cuenta Vista",
  owner: "Cristian Ignacio Valdivia Ramirez",
  accountNumber: "0 070 08 99853 6",
  email: "c@mistokens.com",
};

const Deposit: React.FC = () => {
  const t = useTranslations("deposit");

  const [transferStatus, setTransferStatus] = useState<
    "initiated" | "processing" | "completed" | null
  >(null);
  const [open, setOpen] = useState(false);

  const simulateTransfer = () => {
    setTransferStatus("initiated");
    setOpen(true);
  };

  return (
    <Card className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-3xl bg-white border-2 border-black rounded-xl">
      <CardHeader className="text-black font-beauford font-bold">
        <CardTitle className="flex items-center gap-2">
          {t("deposit")}{" "}
          <FlagIcon code={currencies.CLP.code as FlagIconCode} size={24} className="rounded-md" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-black">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">{t("bankInfo.info")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>{t("bankInfo.bank")}:</strong> {bankInfo.name}
            </p>
            <p>
              <strong>{t("bankInfo.accountNumber")}:</strong> {bankInfo.accountNumber}
            </p>
            <p>
              <strong>{t("bankInfo.owner")}:</strong> {bankInfo.owner}
            </p>
            <p>
              <strong>{t("bankInfo.email")}:</strong> {bankInfo.email}
            </p>
          </CardContent>
        </Card>

        {transferStatus && (
          <Alert
            className={cn(
              "flex items-center justify-center rounded-xl text-white",
              transferStatus === "processing" ? "bg-brand-blue opacity-75" : "bg-black"
            )}
          >
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className="w-full leading-none mt-1">
              {t("transferStatus")}{" "}
              <span className="font-bold">
                {transferStatus === "initiated" && t("initiated")}
                {transferStatus === "processing" && t("processing")}
              </span>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={simulateTransfer}
          className="w-full bg-black text-white font-helvetica font-bold"
        >
          {t("createOrder")}
        </Button>
      </CardFooter>
      <CreateOrder open={open} setOpen={setOpen} setTransferStatus={setTransferStatus} />
    </Card>
  );
};

export default Deposit;
