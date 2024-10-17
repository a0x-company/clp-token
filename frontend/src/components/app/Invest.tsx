"use client";
// react
import { useState } from "react";

// next
import Image from "next/image";

//components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "../ui/input";
import CLPFlag from "../CLPFlag";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { LoadingSpinner } from "../ui/spinner";
import USDCFlag from "../USDCFlag";

// translations
import { useTranslations } from "next-intl";

// utils
import { cn } from "@/lib/utils";

// context
import { useUserStore } from "@/context/global-store";

// wagmi
import { web3AuthInstance } from "@/provider/WagmiConfig";
import { useAccount } from "wagmi";

// axios
import axios from "axios";

// hooks
import { useCLPDBalance } from "@/hooks/useCLPDBalance";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";

// crypto
import crypto from "crypto";

interface CreateStepsProps {
  t: any;
  amount: string;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  email: string;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: InvestStatus | null;
  handleBack: () => void;
  currencyInvest: "USDC" | "CLPD";
  setCurrencyInvest: React.Dispatch<React.SetStateAction<"USDC" | "CLPD">>;
  clpdBalanceFormatted: string;
  usdcBalanceFormatted: string;
  handleMaxAmount: () => void;
}

enum InvestStatus {
  SUCCESS = "SUCCESS",
  PENDING = "PENDING",
  ERROR = "ERROR",
}

const formIds = {
  invest: "invest",
};

const titles = (status: InvestStatus | null) => ({
  0: "invest",
  1: status === InvestStatus.SUCCESS ? "investSuccessTitle" : "investWaitingTitle",
});

const createSteps = ({
  t,
  amount,
  handleAmountChange,
  email,
  handleSubmit,
  status,
  currencyInvest,
  setCurrencyInvest,
  clpdBalanceFormatted,
  usdcBalanceFormatted,
  handleMaxAmount,
}: CreateStepsProps) => [
  {
    step: 0,
    title: t("invest"),
    children: (
      <form id={formIds.invest} onSubmit={handleSubmit} className="flex flex-col gap-2">
        <p
          className={cn(
            "text-base text-brand-blue font-helvetica text-start",
            status === InvestStatus.SUCCESS && "font-bold text-black/50"
          )}
        >
          {t("investBalance")}:
          <span className="font-bold">
            {" "}
            {currencyInvest === "CLPD" ? clpdBalanceFormatted : usdcBalanceFormatted}{" "}
          </span>
          {currencyInvest === "CLPD" ? "CLPD" : "USDC"}
        </p>
        <div className="grid w-full items-center gap-1.5 bg-gray-100 rounded-md p-3 border-2 border-black shadow-brutalist-sm">
          <label htmlFor="amount" className="font-bold text-base">
            {t("transfer")}
          </label>
          <div className="flex items-center gap-4 relative">
            <Input
              type="number"
              id="amount"
              placeholder={currencyInvest === "CLPD" ? t("amountPlaceholder") : "100"}
              value={amount}
              onChange={handleAmountChange}
              className="bg-transparent text-black text-[32px] font-helvetica border-none p-0 focus:outline-none"
            />

            <div className="absolute bottom-0 right-0 flex items-end gap-2">
              <button
                type="button"
                onClick={handleMaxAmount}
                className="bg-white border-2 border-black rounded-full p-1 text-sm font-bold hover:bg-black/5 transition-colors"
              >
                {t("max")}
              </button>
              <HoverCard>
                <HoverCardTrigger className="cursor-pointer hover:bg-black/5 rounded-full">
                  {currencyInvest === "CLPD" ? (
                    <CLPFlag type="CLPD" />
                  ) : (
                    <USDCFlag baseIcon={false} />
                  )}
                </HoverCardTrigger>
                <HoverCardContent className="flex flex-col items-center bg-white border-2 border-black shadow-brutalist-sm w-max">
                  <p className="text-black text-base font-helvetica">{t("changeTo")}</p>
                  <button
                    onClick={() => {
                      if (currencyInvest === "USDC") {
                        setCurrencyInvest("CLPD");
                      } else {
                        setCurrencyInvest("USDC");
                      }
                    }}
                    type="button"
                    className="cursor-pointer hover:bg-gray-100 p-2 rounded-full"
                  >
                    {currencyInvest === "USDC" ? (
                      <CLPFlag type="CLPD" baseIcon />
                    ) : (
                      <USDCFlag baseIcon />
                    )}
                  </button>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
        </div>

        <Image
          src="/images/app/arrow-down.svg"
          alt="arrow-down"
          width={32}
          height={32}
          className="mx-auto"
        />

        <div className="flex w-full items-center gap-1.5 bg-[#F0FCFF] rounded-md p-3 border-2 border-black shadow-brutalist-sm">
          <Image
            src="/images/app/pool-vector.svg"
            alt="pool-vector"
            width={48}
            height={48}
            className=""
          />
          <div className="flex flex-col items-start justify-center">
            <p className="font-bold text-base">{t("pool")}</p>
            <p className="text-base">Base ({currencyInvest})</p>
          </div>
        </div>

        <ul className="flex flex-col gap-2 mt-4">
          <li className="flex items-center gap-1 font-helvetica text-base">
            <Image
              src="/images/app/percentage-vector.svg"
              alt="percentage-vector"
              width={24}
              height={24}
              className=""
            />
            {t("fees")}
          </li>
          <li className="flex items-center gap-1 font-helvetica text-base">
            <Image
              src="/images/app/moneys-vector.svg"
              alt="moneys-vector"
              width={24}
              height={24}
              className=""
            />
            {t("increase")}
          </li>
          <li className="flex items-center gap-1 font-helvetica text-base">
            <Image
              src="/images/app/money-send-vector.svg"
              alt="money-send-vector"
              width={24}
              height={24}
              className=""
            />
            {t("benefits")}
          </li>
        </ul>
      </form>
    ),
    formId: formIds.invest,
    status,
  },
  {
    step: 1,
    title: t("investSuccessTitle"),
    children: (
      <div className="flex flex-col items-start justify-center gap-2">
        <Image
          src={
            status === InvestStatus.SUCCESS
              ? "/images/app/bars-end-gif.gif"
              : "/images/app/bars-earn-gif.gif"
          }
          alt="done"
          width={200}
          height={200}
          className="mx-auto"
          unoptimized
        />
        <p
          className={cn(
            "text-xl font-helvetica font-light text-start text-white",
            status === InvestStatus.SUCCESS && "font-bold text-black"
          )}
        >
          {status === InvestStatus.SUCCESS
            ? t("investSuccessDescription")
            : t("investWaitingDescription")}
        </p>
        <p
          className={cn(
            "text-base text-white/50 font-helvetica text-start",
            status === InvestStatus.SUCCESS && "font-bold text-black/50"
          )}
        >
          {status === InvestStatus.SUCCESS
            ? `${t("invested")}: ${amount} ${currencyInvest === "CLPD" ? "CLPD" : "USDC"}`
            : `${t("yourEmail")}: ${email}`}
        </p>
      </div>
    ),
  },
];

const Invest: React.FC = () => {
  const t = useTranslations("invest");

  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [currencyInvest, setCurrencyInvest] = useState<"USDC" | "CLPD">("CLPD");

  const [status, setStatus] = useState<InvestStatus>(InvestStatus.PENDING);

  const { address: userAddress } = useAccount();

  const { clpdBalanceFormatted, refetch: refetchCLPDBalance } = useCLPDBalance({
    address: userAddress,
  });
  const { usdcBalanceFormatted, refetch: refetchUSDCBalance } = useUSDCBalance({
    address: userAddress,
  });

  const { user } = useUserStore();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    value = value.replace(/[^0-9]/g, "");

    if (value.length > 1 && value.startsWith("0")) {
      value = value.replace(/^0+/, "");
    }

    setAmount(value);
  };

  const handleMaxAmount = () => {
    setAmount(currencyInvest === "CLPD" ? clpdBalanceFormatted : usdcBalanceFormatted);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    console.log(currentStep);
    switch (currentStep) {
      case 0:
        setCurrentStep(1);
        // new Promise((resolve) =>
        //   setTimeout(() => {
        //     setStatus(InvestStatus.SUCCESS);
        //     setLoading(false);
        //   }, 5000)
        // );
        if (amount === "" || !amount || Number(amount) === 0) {
          setLoading(false);
          return;
        }

        const userInfo = await web3AuthInstance.getUserInfo();
        const idToken = userInfo?.idToken;
        const privateKey = (await web3AuthInstance.provider?.request({
          method: "private_key",
        })) as string;

        // Encriptar la clave privada antes de enviarla
        const encryptionKey = crypto.randomBytes(32).toString("hex");
        const iv = crypto.randomBytes(16).toString("hex");
        const cipher = crypto.createCipheriv(
          "aes-256-cbc",
          Buffer.from(encryptionKey, "hex"),
          Buffer.from(iv, "hex")
        );
        let encryptedPKey = cipher.update(privateKey, "utf8", "hex");
        encryptedPKey += cipher.final("hex");
        try {
          setCurrentStep(1);
          const response = await axios.post(
            `/api/invest/${currencyInvest.toLowerCase()}`,
            { investAmount: amount, userAddress, encryptedPKey, iv },
            // { investAmount: 0.01, userAddress, encryptedPKey, iv },
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
                "X-Encryption-Key": encryptionKey,
              },
            }
          );
          console.log(response);
          if (response.status === 201 || response.status === 200) {
            setStatus(InvestStatus.SUCCESS);
            if (currencyInvest === "CLPD") {
              refetchCLPDBalance();
            } else {
              refetchUSDCBalance();
            }
          }
        } catch (error) {
          console.log(error);
          setCurrentStep(0);
        } finally {
          setLoading(false);
        }
        break;
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAmount("");
    setStatus(InvestStatus.PENDING);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Card
      className={cn(
        "w-full max-w-xl bg-white border-2 border-black rounded-xl shadow-brutalist max-md:w-[90%] mx-auto md:mt-10 relative",
        currentStep === 1 && status !== InvestStatus.SUCCESS
          ? "bg-brand-blue"
          : currentStep === 1 && status === InvestStatus.SUCCESS
          ? "bg-brand-green-pastel"
          : "h-auto"
      )}
    >
      <CardContent
        className={cn(
          "space-y-4 text-black pt-6",
          currentStep === 1 ? (status === InvestStatus.SUCCESS ? "text-black" : "text-white") : ""
        )}
      >
        <div className="flex flex-col rounded-xl border-none gap-3">
          <h3 className="text-xl font-helvetica font-bold">
            {t(Object.values(titles(status))[currentStep])}
          </h3>
          <CardContent className="p-0 space-y-2">
            {
              createSteps({
                t,
                amount,
                handleAmountChange,
                email: user?.email || "",
                handleSubmit,
                status,
                handleBack,
                currencyInvest,
                setCurrencyInvest,
                clpdBalanceFormatted,
                usdcBalanceFormatted,
                handleMaxAmount,
              })[currentStep].children
            }
          </CardContent>
        </div>
      </CardContent>

      {currentStep !== 1 && (
        <CardFooter>
          <Button
            className="w-full bg-brand-blue-dark border-2 border-black shadow-brutalist-sm py-4 h-full text-xl hover:bg-brand-blue-dark/90 text-white font-helvetica font-bold"
            type="submit"
            form={Object.values(formIds)[currentStep]}
          >
            {!loading ? t("investButton") : <LoadingSpinner />}
          </Button>
        </CardFooter>
      )}

      {currentStep === 1 && status === InvestStatus.SUCCESS && (
        <CardFooter>
          <Button
            onClick={handleReset}
            className="w-full bg-white border-2 border-black shadow-brutalist-sm py-4 h-full text-xl hover:bg-white/90 text-black font-helvetica font-bold"
          >
            ¡{t("ready")}!
          </Button>
        </CardFooter>
      )}

      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex justify-center my-2 space-x-2 bg-white w-full max-w-3xl rounded-full">
        {Object.keys(titles(status)).map((s) => (
          <div
            key={s}
            className={`w-full h-2 rounded-full ${
              parseInt(s) === currentStep && status !== InvestStatus.SUCCESS
                ? "bg-black"
                : status === InvestStatus.SUCCESS && currentStep === 1
                ? "bg-brand-green-pastel"
                : "bg-black/30"
            }`}
          />
        ))}
      </div>
    </Card>
  );
};

export default Invest;
