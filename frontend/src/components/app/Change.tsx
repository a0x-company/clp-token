"use client";
// react
import { useEffect, useMemo, useState } from "react";

// next
import Image from "next/image";

//components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import CLPFlag from "../CLPFlag";
import { Input } from "../ui/input";
import USDCFlag from "../USDCFlag";
import { LoadingSpinner } from "../ui/spinner";

// icons

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

// crypto
import crypto from "crypto";

// hooks
import { useCLPDBalance } from "@/hooks/useCLPDBalance";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";

const MAX_AMOUNT = 10000000;

interface CreateStepsProps {
  t: any;
  amount: string;
  max: boolean;
  amountFormatted: string;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  email: string;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: ChangeStatus | null;
  handleBack: () => void;
  tokenIn: Token;
  tokenOut: Token;
  clpdBalanceFormatted: string;
  usdcBalanceFormatted: string;
  handleMaxAmount: () => void;
  handleSwitchTokens: () => void;
  amountReceive: string;
}

enum ChangeStatus {
  SUCCESS = "SUCCESS",
  PENDING = "PENDING",
  ERROR = "ERROR",
}

interface Token {
  symbol: string;
  address: string;
}

const formIds = {
  change: "change",
};

const titles = (status: ChangeStatus | null) => ({
  0: "change",
  1: status === ChangeStatus.SUCCESS ? "changeSuccessTitle" : "changeWaitingTitle",
});

const createSteps = ({
  t,
  max,
  amount,
  amountFormatted,
  handleAmountChange,
  email,
  handleSubmit,
  status,
  tokenIn,
  tokenOut,
  clpdBalanceFormatted,
  usdcBalanceFormatted,
  amountReceive,
  handleMaxAmount,
  handleSwitchTokens,
}: CreateStepsProps) => [
  {
    step: 0,
    children: (
      <form id={formIds.change} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex max-md:flex-col items-center gap-4 relative">
          <div className="flex flex-col gap-2 border-2 border-black rounded-md p-4 w-full md:w-1/2">
            <p>{t("from")}</p>
            <div className="flex items-center gap-4 relative">
              <div
                className={cn(
                  "opacity-0 transition-opacity duration-300",
                  tokenIn.symbol === "CLPD" && "opacity-100"
                )}
              >
                <CLPFlag type={"CLPD"} baseIcon />
              </div>
              <div
                className={cn(
                  "opacity-0 transition-opacity duration-300 absolute",
                  tokenIn.symbol === "USDC" && "opacity-100"
                )}
              >
                <USDCFlag baseIcon />
              </div>
              <p className="text-black text-[20px] font-bold font-helvetica border-none p-0 focus:outline-none">
                {tokenIn.symbol}
              </p>
            </div>
          </div>

          <button
            onClick={handleSwitchTokens}
            type="button"
            className="flex items-center justify-center gap-4 group self-center absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 p-4 bg-brand-yellow-pastel rounded-full w-16 h-16 z-10 border-2 border-black shadow-brutalist-sm hover:bg-[#FFF8CC] transition-all duration-300 cursor-pointer max-md:rotate-90"
          >
            <Image
              src="/images/app/arrow-right.svg"
              alt="arrow-right"
              width={24}
              height={24}
              className="group-hover:hidden"
            />
            <Image
              src="/images/app/arrow-switch.svg"
              alt="arrow-switch"
              width={24}
              height={24}
              className="hidden group-hover:block"
            />
          </button>

          <div className="flex flex-col gap-2 border-2 border-black rounded-md p-4 md:px-8 w-full md:w-1/2">
            <p>{t("to")}</p>
            <div className="flex items-center gap-4 relative">
              <div
                className={cn(
                  "opacity-0 transition-opacity duration-300",
                  tokenOut.symbol === "USDC" && "opacity-100"
                )}
              >
                <USDCFlag baseIcon />
              </div>
              <div
                className={cn(
                  "opacity-0 transition-opacity duration-300 absolute",
                  tokenOut.symbol === "CLPD" && "opacity-100"
                )}
              >
                <CLPFlag type={"CLPD"} baseIcon />
              </div>
              <p className="text-black text-[20px] font-bold font-helvetica border-none p-0 focus:outline-none">
                {tokenOut.symbol}
              </p>
            </div>
          </div>
        </div>

        <div className="grid w-full items-center gap-1.5 bg-[#F0FCFF] rounded-md p-3 border-2 border-black shadow-brutalist-sm">
          <label htmlFor="amount" className="font-bold text-base">
            {t("send")}
          </label>
          <div className="flex items-center gap-4 relative">
            <div className="flex items-center gap-2">
              {tokenIn.symbol === "CLPD" ? <CLPFlag type="CLPD" baseIcon /> : <USDCFlag baseIcon />}
            </div>

            <div className="flex items-center gap-2 relative w-full">
              <Input
                type="number"
                id="amount"
                placeholder={tokenIn.symbol === "CLPD" ? t("amountPlaceholder") : "100"}
                value={amount}
                onChange={handleAmountChange}
                className="bg-transparent text-black text-[32px] font-helvetica border-none p-0 focus:outline-none opacity-0 absolute inset-0 md:w-96 h-full"
              />
              <div className="text-black text-[32px] font-helvetica w-full">
                {amountFormatted || amount}
              </div>

              <button
                type="button"
                onClick={handleMaxAmount}
                className={cn(
                  "bg-white border-2 border-black rounded-full p-1 text-sm font-bold hover:bg-black/5 transition-colors self-end",
                  max && "bg-brand-blue/50"
                )}
              >
                {t("max")}
              </button>
            </div>
          </div>
        </div>

        <div className="grid w-full items-center gap-1.5 bg-[#F0FCFF] rounded-md p-3 border-2 border-black shadow-brutalist-sm">
          <label htmlFor="amount" className="font-bold text-base">
            {t("receive")}
          </label>
          <div className="flex items-center gap-4 relative w-full">
            <div className="">
              {tokenOut.symbol === "USDC" ? (
                <USDCFlag baseIcon />
              ) : (
                <CLPFlag type="CLPD" baseIcon />
              )}
            </div>

            <div className="flex items-center gap-2 w-full justify-between">
              <p className="text-black text-[32px] font-helvetica border-none p-0 focus:outline-none">
                {amountReceive}
              </p>
            </div>
          </div>
        </div>
        <p
          className={cn(
            "text-base text-brand-blue font-helvetica text-start mt-2",
            status === ChangeStatus.SUCCESS && "font-bold text-black/50"
          )}
        >
          {t("changeBalance")}:
          <span className="font-bold">
            {" "}
            {tokenIn.symbol === "CLPD" ? clpdBalanceFormatted : usdcBalanceFormatted}{" "}
          </span>
          {tokenIn.symbol === "CLPD" ? "CLPD" : "USDC"}
        </p>
      </form>
    ),
    formId: formIds.change,
    status,
  },
  {
    step: 1,
    children: (
      <div className="flex flex-col items-start justify-center gap-2">
        <Image
          src={
            status === ChangeStatus.SUCCESS
              ? "/images/app/layers-gif.gif"
              : "/images/app/layers-end-gif.gif"
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
            status === ChangeStatus.SUCCESS && "font-bold text-black"
          )}
        >
          {status === ChangeStatus.SUCCESS
            ? t("changeSuccessDescription")
            : t("changeWaitingDescription")}
        </p>
        <p
          className={cn(
            "text-base text-white/50 font-helvetica text-start",
            status === ChangeStatus.SUCCESS && "font-bold text-black/50"
          )}
        >
          {status === ChangeStatus.SUCCESS ? `${t("yourBalance")}:` : `${t("yourEmail")}: ${email}`}
        </p>
        {status === ChangeStatus.SUCCESS && (
          <div className="flex flex-col items-start gap-2">
            <span className="font-bold text-black/50">{clpdBalanceFormatted} CLPD</span>
            <span className="font-bold text-black/50">{usdcBalanceFormatted} USDC</span>
          </div>
        )}
      </div>
    ),
  },
];

const Change: React.FC = () => {
  const t = useTranslations("change");

  const [amount, setAmount] = useState<string>("");
  const [amountFormatted, setAmountFormatted] = useState<string>("0");
  const [amountReceive, setAmountReceive] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [tokenIn, setTokenIn] = useState<Token>({ symbol: "CLPD", address: "" });
  const [tokenOut, setTokenOut] = useState<Token>({ symbol: "USDC", address: "" });
  const [status, setStatus] = useState<ChangeStatus>(ChangeStatus.PENDING);
  const [max, setMax] = useState<boolean>(false);
  const [errorFields, setErrorFields] = useState<string[]>([]);

  const { address: userAddress } = useAccount();

  const { clpdBalanceFormatted, refetch: refetchCLPDBalance } = useCLPDBalance({
    address: userAddress,
  });
  const { usdcBalanceFormatted, refetch: refetchUSDCBalance } = useUSDCBalance({
    address: userAddress,
  });

  const handleConvertAmount = useMemo(() => {
    if (tokenIn.symbol === "CLPD") {
      return (Number(amount) / 1000).toString();
    } else {
      return (Number(amount) * 1000).toString();
    }
  }, [tokenIn, amount]);

  useEffect(() => {
    setAmountReceive(handleConvertAmount);
  }, [handleConvertAmount]);

  const { user } = useUserStore();

  const handleSwitchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (value === "") {
      setAmount("");
      setAmountFormatted("0");
      setErrorFields([]);
      return;
    }

    value = value.replace(/[^0-9.]/g, "");

    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    // Limitar a dos decimales
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + "." + parts[1].slice(0, 2);
    }

    const numericValue = parseFloat(value);
    const availableAmount = parseFloat(
      tokenIn.symbol === "CLPD"
        ? clpdBalanceFormatted.replace(/,/g, "")
        : usdcBalanceFormatted.replace(/,/g, "")
    );

    if (numericValue > availableAmount) {
      value = availableAmount.toFixed(2);
      setMax(true);
    } else if (isNaN(numericValue) || numericValue === 0) {
      value = "0";
      setErrorFields(["insufficientBalance"]);
    } else if (numericValue > MAX_AMOUNT) {
      value = MAX_AMOUNT.toFixed(2);
      setMax(true);
    } else if (Number(amount) !== availableAmount && max) {
      setMax(false);
    }

    setAmount(value);
    setAmountFormatted(value);
  };

  const handleMaxAmount = () => {
    setAmount(tokenIn.symbol === "CLPD" ? clpdBalanceFormatted : usdcBalanceFormatted);
    setAmountFormatted(tokenIn.symbol === "CLPD" ? clpdBalanceFormatted : usdcBalanceFormatted);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const userInfo = await web3AuthInstance.getUserInfo();
    const idToken = userInfo?.idToken;
    console.log(currentStep);
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
    switch (currentStep) {
      case 0:
        setCurrentStep(1);
        if (amount === "" || !amount || Number(amount) === 0) {
          setLoading(false);
          return;
        }
        try {
          const response = await axios.post(
            "/api/swap",
            { amountIn: amount, userAddress, encryptedPKey, iv, tokenIn: tokenIn.symbol },
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
            setStatus(ChangeStatus.SUCCESS);
            refetchCLPDBalance();
            refetchUSDCBalance();
            setCurrentStep(1);
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
    setStatus(ChangeStatus.PENDING);
    setAmount("");
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Card
      className={cn(
        "w-full max-w-xl bg-white border-2 border-black rounded-xl shadow-brutalist max-md:w-[90%] mx-auto mb-10 md:mt-10 relative",
        currentStep === 1 && status !== ChangeStatus.SUCCESS
          ? "bg-brand-blue"
          : currentStep === 1 && status === ChangeStatus.SUCCESS
          ? "bg-brand-green-pastel"
          : "h-auto"
      )}
    >
      <CardContent
        className={cn(
          "space-y-4 text-black pt-6",
          currentStep === 1 ? (status === ChangeStatus.SUCCESS ? "text-black" : "text-white") : ""
        )}
      >
        <div className="flex flex-col rounded-xl border-none gap-3">
          <h3 className="text-xl font-helvetica font-bold">
            {t(Object.values(titles(status))[currentStep])} {tokenIn.symbol} {t("and")}{" "}
            {tokenOut.symbol}
          </h3>
          <CardContent className="p-0 space-y-2">
            {
              createSteps({
                t,
                max,
                amount,
                amountFormatted,
                handleAmountChange,
                email: user?.email || "",
                handleSubmit,
                status,
                handleBack,
                tokenIn,
                tokenOut,
                clpdBalanceFormatted,
                usdcBalanceFormatted,
                handleMaxAmount,
                handleSwitchTokens,
                amountReceive,
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
            disabled={loading}
          >
            {!loading ? t("changeButton") : <LoadingSpinner />}
          </Button>
        </CardFooter>
      )}

      {currentStep === 1 && status === ChangeStatus.SUCCESS && (
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
              parseInt(s) === currentStep && status !== ChangeStatus.SUCCESS
                ? "bg-black"
                : status === ChangeStatus.SUCCESS && currentStep === 1
                ? "bg-brand-green-pastel"
                : "bg-black/30"
            }`}
          />
        ))}
      </div>
    </Card>
  );
};

export default Change;
