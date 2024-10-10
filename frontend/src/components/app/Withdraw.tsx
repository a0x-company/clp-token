"use client";
// react
import { useState } from "react";
import { Input } from "@/components/ui/input";

// componentes
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "../ui/alert";

// icons
import { InfoIcon } from "lucide-react";

// translations
import { useTranslations } from "next-intl";

// utils
import { cn } from "@/lib/utils";
import WithdrawOrder from "./WithdrawOrder";
import CLPFlag from "../CLPFlag";
import Image from "next/image";

const Withdraw: React.FC = () => {
  const t = useTranslations("withdraw");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const [withdrawStatus, setWithdrawStatus] = useState<
    "initiated" | "processing" | "completed" | null
  >(null);
  const [open, setOpen] = useState(false);

  const simulateWithdraw = () => {
    if (!withdrawAmount) return;
    setWithdrawStatus("initiated");
    setOpen(true);
  };

  return (
    <Card className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-3xl bg-white border-2 border-black rounded-xl">
      <CardHeader className="text-black font-helvetica font-bold">
        <CardTitle className="flex items-center gap-2">{t("withdraw")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-black">
        <div className="flex flex-col flex-1 gap-4 w-full">
          <div className="bg-white border-2 border-black rounded-xl p-4 flex justify-between items-center w-full">
            <div className="w-full">
              <div className="text-xl font-helvetica font-bold">{t("receive")}</div>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="10.000"
                className="text-[28px] font-bold w-full bg-white border-none focus:outline-none font-helvetica"
              />
            </div>

            <CLPFlag type="CLP" />
          </div>

          <div className="flex justify-center ">
            <Image
              src="/images/landing/withdraw-vector.svg"
              alt="Withdraw"
              width={48}
              height={48}
            />
          </div>

          <div className="bg-black text-white rounded-xl p-4 flex justify-between items-center w-full">
            <div>
              <div className="text-xl font-helvetica font-bold">{t("redeem")}</div>
              <div className="text-[28px] font-helvetica font-bold">
                {withdrawAmount || "0"} CLPD
              </div>
            </div>

            <CLPFlag type="CLPD" />
          </div>
        </div>

        {withdrawStatus && (
          <Alert
            className={cn(
              "flex items-center justify-center rounded-xl text-white",
              withdrawStatus === "processing" ? "bg-brand-blue opacity-75" : "bg-black"
            )}
          >
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className="w-full leading-none mt-1">
              {t("withdrawStatus")}{" "}
              <span className="font-bold">
                {withdrawStatus === "initiated" && t("initiated")}
                {withdrawStatus === "processing" && t("processing")}
              </span>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={simulateWithdraw}
          className="w-full bg-black text-white font-helvetica font-bold"
        >
          {t("createWithdraw")}
        </Button>
      </CardFooter>
      <WithdrawOrder
        open={open}
        setOpen={setOpen}
        setWithdrawStatus={setWithdrawStatus}
        amount={withdrawAmount}
      />
    </Card>
  );
};

export default Withdraw;
