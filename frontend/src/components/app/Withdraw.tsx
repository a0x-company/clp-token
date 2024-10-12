"use client";
// react
import { useEffect, useState } from "react";

// next
import Image from "next/image";

// componentes
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import CLPFlag from "../CLPFlag";

// icons
import { LucideArrowLeft, PencilLine } from "lucide-react";

// translations
import { useTranslations } from "next-intl";

// utils
import { cn, formatNumber } from "@/lib/utils";
import { web3AuthInstance } from "@/provider/WagmiConfig";

// http client
import axios from "axios";

// types
import { BankInfo, RedeemStatus } from "@/types/withdraw.type";

// hooks
import { useRedeemStatus } from "@/hooks/useRedeemStatus";

// ui
import { Checkbox } from "../ui/checkbox";
import { LoadingSpinner } from "../ui/spinner";

// context
import { useUserStore } from "@/context/global-store";

// crypto
import { useCLPDBalance } from "@/hooks/useCLPDBalance";
import crypto from "crypto";
import { useAccount } from "wagmi";

interface CreateStepsProps {
  t: (key: string) => string;
  type: "withdraw" | "redeem";
  addressDestination: `0x${string}` | null;
  setType: (type: "withdraw" | "redeem") => void;
  setAddressDestination: (address: `0x${string}`) => void;
  setBankInfo: (bankInfo: BankInfo) => void;
  amount: string;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bankInfo: BankInfo;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  status: RedeemStatus | null;
  handleBack: () => void;
  errorFields: string[];
  email: string;
  handleMaxAmount: () => void;
}

const formIds = {
  createOrder: "create-order",
  reedem: "reedem",
  transfer: "transfer",
};

const titles = (type: "redeem" | "withdraw") => ({
  0: "createWithdrawOrder",
  1: type === "redeem" ? "redeemStep1" : "transferStep1",
  2: type === "redeem" ? "step3" : "transferStep3",
});

const createSteps = ({
  t,
  amount,
  type,
  addressDestination,
  setType,
  setBankInfo,
  setAddressDestination,
  handleAmountChange,
  bankInfo,
  handleSubmit,
  status,
  handleBack,
  errorFields,
  email,
  handleMaxAmount,
}: CreateStepsProps) => [
  {
    step: 0,
    title: t("createWithdrawOrder"),
    children: (
      <form id={formIds.createOrder} onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div
          className={cn(
            "grid w-full items-center gap-1.5 bg-gray-100 rounded-md p-3 border-2 border-black shadow-brutalist-sm relative transition-all duration-300 h-auto",
            errorFields.includes("amount") && "bg-red-100"
          )}
        >
          <label htmlFor="amount" className="font-bold text-base">
            {t("redeem")}
          </label>
          <div className="flex items-center gap-4 relative">
            <button
              type="button"
              onClick={handleMaxAmount}
              className="absolute bottom-0 right-20 bg-white border-2 border-black rounded-full p-1 text-sm font-bold hover:bg-black/5 transition-colors"
            >
              {t("max")}
            </button>
            <Input
              type="number"
              id="amount"
              placeholder={t("amountPlaceholder")}
              value={amount}
              onChange={handleAmountChange}
              className="bg-transparent text-black text-[32px] font-helvetica border-none p-0 focus:outline-none"
            />

            <CLPFlag type="CLPD" />
          </div>
          {errorFields.includes("amount") && (
            <p className="text-red-500 text-sm">{t("errorFields.amount")}</p>
          )}
        </div>

        <Image
          src="/images/app/arrow-down.svg"
          alt="arrow-down"
          width={32}
          height={32}
          className="mx-auto"
        />

        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md p-3 border-2 border-black shadow-brutalist-sm",
            type === "redeem" ? "bg-[#F0FCFF]" : "bg-white"
          )}
          type="button"
          onClick={() => setType("redeem")}
        >
          <Image
            src="/images/app/bank-vector.svg"
            alt="bank-vector"
            width={48}
            height={48}
            className=""
          />

          <div className="flex flex-col items-start justify-center relative">
            <p className="font-bold text-base">{t("transferBank")}</p>
            <p className="text-base">{t("bankChile")} (CLP)</p>
          </div>
        </button>

        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md p-3 border-2 border-black shadow-brutalist-sm",
            type === "withdraw" ? "bg-[#F0FCFF]" : "bg-white"
          )}
          type="button"
          onClick={() => setType("withdraw")}
        >
          <Image
            src="/images/app/base-logo.svg"
            alt="base-logo"
            width={48}
            height={48}
            className=""
          />

          <div className="flex flex-col items-start justify-center relative">
            <p className="font-bold text-base">Wallet</p>
            <p className="text-base">{t("baseAddress")} (CLPD)</p>
          </div>
        </button>
      </form>
    ),
    formId: formIds.createOrder,
    status,
  },
  {
    step: 1,
    title: type === "redeem" ? t("redeemStep1") : t("transferStep1"),
    children:
      type === "redeem" ? (
        <form
          id={formIds.reedem}
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 rounded-md font-helvetica"
        >
          <label htmlFor="bankName" className="font-bold text-base">
            {t("bankInfo.bankName")}
          </label>
          <Input
            type="text"
            id="bankName"
            value={bankInfo.bankName}
            onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
            placeholder={t("bankInfo.bankNamePlaceholder")}
            className="font-helvetica font-bold bg-transparent border-2 border-black shadow-brutalist-sm outline-none"
          />
          {errorFields.includes("bankName") && (
            <p className="text-red-500 text-sm">{t("errorFields.bankName")}</p>
          )}

          <label htmlFor="accountType" className="font-bold text-base">
            {t("bankInfo.accountType")}
          </label>
          <Input
            type="text"
            id="accountType"
            value={bankInfo.accountType}
            onChange={(e) => setBankInfo({ ...bankInfo, accountType: e.target.value })}
            placeholder={t("bankInfo.accountTypePlaceholder")}
            className="font-helvetica font-bold bg-transparent border-2 border-black shadow-brutalist-sm outline-none"
          />
          {errorFields.includes("accountType") && (
            <p className="text-red-500 text-sm">{t("errorFields.accountType")}</p>
          )}

          <label htmlFor="accountNumber" className="font-bold text-base">
            {t("bankInfo.accountNumber")}
          </label>
          <Input
            type="text"
            id="accountNumber"
            value={bankInfo.accountNumber}
            onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
            placeholder={t("bankInfo.accountNumberPlaceholder")}
            className="font-helvetica font-bold bg-transparent border-2 border-black shadow-brutalist-sm outline-none"
          />
          {errorFields.includes("accountNumber") && (
            <p className="text-red-500 text-sm">{t("errorFields.accountNumber")}</p>
          )}

          <label htmlFor="name" className="font-bold text-base">
            {t("bankInfo.name")}
          </label>
          <Input
            type="text"
            id="name"
            value={bankInfo.name}
            onChange={(e) => setBankInfo({ ...bankInfo, name: e.target.value })}
            placeholder={t("bankInfo.namePlaceholder")}
            className="font-helvetica font-bold bg-transparent border-2 border-black shadow-brutalist-sm outline-none"
          />
          {errorFields.includes("name") && (
            <p className="text-red-500 text-sm">{t("errorFields.name")}</p>
          )}

          <label htmlFor="email" className="font-bold text-base">
            {t("bankInfo.email")}
          </label>
          <Input
            type="email"
            id="email"
            value={bankInfo.email}
            onChange={(e) => setBankInfo({ ...bankInfo, email: e.target.value })}
            placeholder={t("bankInfo.emailPlaceholder")}
            className="font-helvetica font-bold bg-transparent border-2 border-black shadow-brutalist-sm outline-none"
          />
          {errorFields.includes("email") && (
            <p className="text-red-500 text-sm">{t("errorFields.email")}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <p className="text-sm text-black font-helvetica">
              {t("willBeSent")}: <span className="font-bold">{formatNumber(Number(amount))}</span>{" "}
              CLPD
            </p>
            <button type="button" className="text-brand-blue" onClick={handleBack}>
              <PencilLine className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="ownershipCheck" />
            <p className="text-sm text-black font-helvetica italic">{t("ownershipCheck")}</p>
          </div>
          {errorFields.includes("ownershipCheck") && (
            <p className="text-red-500 text-sm">{t("errorFields.ownershipCheck")}</p>
          )}
        </form>
      ) : (
        <form id={formIds.transfer} onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex items-center justify-start gap-2">
            <h4 className="font-bold text-base text-brand-blue mt-1">{t("networkShouldBe")}</h4>
            <Image
              src="/images/app/base-logo.svg"
              alt="base-logo"
              width={18}
              height={18}
              className=""
            />
          </div>
          <Input
            type="text"
            value={addressDestination || ""}
            onChange={(e) => setAddressDestination(e.target.value as `0x${string}`)}
            placeholder={t("baseAddressPlaceholder")}
            className="font-helvetica font-bold bg-transparent border-2 border-black shadow-brutalist-sm outline-none"
          />
          <div className="flex items-center gap-2 mt-3">
            <p className="text-sm text-black font-helvetica">
              {t("willBeSent")}: <span className="font-bold">{formatNumber(Number(amount))}</span>{" "}
              CLPD
            </p>
            <button type="button" className="text-brand-blue" onClick={handleBack}>
              <PencilLine className="w-4 h-4" />
            </button>
          </div>
        </form>
      ),
    formId: type === "redeem" ? formIds.reedem : formIds.transfer,
  },
  {
    step: 2,
    title:
      type === "redeem"
        ? status === RedeemStatus.ACCEPTED_BURNED
          ? t("step3Burned")
          : t("step3")
        : t("step3Burned"),
    children: (
      <div className="flex flex-col items-start justify-center gap-2">
        <Image
          src={
            type === "redeem"
              ? status === RedeemStatus.ACCEPTED_BURNED
                ? "/images/app/success-gif.gif"
                : "/images/app/wired-gif.gif"
              : "/images/app/success-gif.gif"
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
            type === "redeem"
              ? status === RedeemStatus.ACCEPTED_BURNED && "font-bold text-black"
              : "font-bold text-black"
          )}
        >
          {type === "redeem"
            ? status === RedeemStatus.ACCEPTED_BURNED
              ? t("step3BurnedDescription")
              : t("step3Description")
            : t("step3BurnedDescription")}
        </p>
        <p
          className={cn(
            "text-base text-white/50 font-helvetica text-start",
            type === "redeem"
              ? status === RedeemStatus.ACCEPTED_BURNED && "font-bold text-black/50"
              : "font-bold text-black/50"
          )}
        >
          {type === "redeem"
            ? status === RedeemStatus.ACCEPTED_BURNED
              ? `${t("step3BurnedBalance")}: ${amount} CLPD`
              : `${t("yourEmail")}: ${email}`
            : `${t("step3BurnedBalance")}: ${amount} CLPD`}
        </p>
      </div>
    ),
  },
];

const Withdraw: React.FC = () => {
  const t = useTranslations("withdraw");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(0);
  /* Types withdraw: 
    redeem: Bank transfer
    withdraw: Transfer to wallet
   */
  const [type, setType] = useState<"redeem" | "withdraw">("redeem");
  const [loading, setLoading] = useState<boolean>(false);
  const [redeemId, setRedeemId] = useState<string>("");
  const [errorFields, setErrorFields] = useState<string[]>([]);
  const [addressDestination, setAddressDestination] = useState<`0x${string}` | null>(null);

  const { status, loading: statusLoading, error, refetch } = useRedeemStatus(redeemId);

  useEffect(() => {
    const savedRedeemId = localStorage.getItem("redeemId");
    if (savedRedeemId) {
      setRedeemId(savedRedeemId);
      refetch();
    }
  }, []);

  useEffect(() => {
    if (status === RedeemStatus.PENDING && currentStep === 0) {
      setCurrentStep(2);
    }
  }, [status, currentStep]);

  const saveRedeemIdToLocalStorage = (id: string) => {
    localStorage.setItem("redeemId", id);
  };

  const { user } = useUserStore();

  const { address: userAddress } = useAccount();
  const { clpdBalanceFormatted, refetch: refetchCLPDBalance } = useCLPDBalance({
    address: userAddress,
  });

  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankName: "",
    name: "",
    accountNumber: "",
    accountType: "",
    email: user?.email || "",
  });

  const handleMaxAmount = () => {
    setWithdrawAmount(clpdBalanceFormatted);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    value = value.replace(/[^0-9]/g, "");

    if (value.length > 1 && value.startsWith("0")) {
      value = value.replace(/^0+/, "");
    }

    setWithdrawAmount(value);
    if (Number(value) > Number(clpdBalanceFormatted)) {
      setErrorFields((prev) => [...prev, "amount"]);
    } else {
      setErrorFields((prev) => prev.filter((field) => field !== "amount"));
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleTransfer = async () => {
    setLoading(true);
    try {
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

      const response = await axios.post(
        "/api/transfer",
        {
          userAddress,
          address: addressDestination,
          withdrawAmount: withdrawAmount,
          encryptedPKey,
          iv,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "X-Encryption-Key": encryptionKey,
          },
        }
      );

      if (response.status === 200) {
        // Manejar respuesta exitosa
        console.log("Transferencia iniciada:", response.data);
        setCurrentStep(2);
        refetchCLPDBalance();
        // Actualizar el estado o navegar a la siguiente pantalla
      }
    } catch (error) {
      console.error("Error al iniciar la transferencia:", error);
      // Manejar el error (mostrar mensaje al usuario, etc.)
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    // try {
    //   console.log("Monto:", withdrawAmount);
    //   console.log("Retiro:", redeemId);
    //   const userInfo = await web3AuthInstance.getUserInfo();
    //   const idToken = userInfo?.idToken;
    //   const response = await axios.post(
    //     "/api/withdraw/redeem",
    //     { amount: withdrawAmount, redeemId, bankInfo },
    //     {
    //       headers: {
    //         Authorization: `Bearer ${idToken}`,
    //         "Content-Type": "application/json",
    //       },
    //     }
    //   );
    //   console.log(response);
    //   if (response.status === 201 || response.status === 200) {
    //     setWithdrawAmount("");
    //     setBankInfo({
    //       name: "",
    //       accountNumber: "",
    //       accountType: "",
    //       email: "",
    //     });
    //     setCurrentStep(2);
    //   }
    // } catch (error) {
    //   console.log(error);
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const userInfo = await web3AuthInstance.getUserInfo();
    const idToken = userInfo?.idToken;
    console.log(currentStep, type);
    switch (currentStep) {
      case 0:
        setCurrentStep(1);
        setLoading(false);
        // if (withdrawAmount === "" || !withdrawAmount || Number(withdrawAmount) === 0) {
        //   setLoading(false);
        //   return;
        // }
        // try {
        //   const response = await axios.post(
        //     "/api/withdraw/create-order",
        //     { amount: withdrawAmount },
        //     {
        //       headers: {
        //         Authorization: `Bearer ${idToken}`,
        //         "Content-Type": "application/json",
        //       },
        //     }
        //   );
        //   console.log(response);
        //   if (response.status === 201 || response.status === 200) {
        //     console.log("Retiro:", response.data.redeemId);
        //     setRedeemId(response.data.redeemId);
        //     saveRedeemIdToLocalStorage(response.data.redeemId);
        //     setCurrentStep(1);
        //   }
        // } catch (error) {
        //   console.log(error);
        // } finally {
        //   setLoading(false);
        // }
        break;
      case 1:
        switch (type) {
          case "redeem":
            handleRedeem();
            break;
          case "withdraw":
            handleTransfer();
            break;
        }
    }
  };

  return (
    <Card
      className={cn(
        "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-xl bg-white border-2 border-black rounded-xl shadow-brutalist max-md:w-[90%] transition-all duration-200",
        currentStep === 2 && status !== RedeemStatus.ACCEPTED_BURNED
          ? "bg-brand-blue"
          : currentStep === 2 && status === RedeemStatus.ACCEPTED_BURNED
          ? "bg-brand-green-pastel"
          : "h-auto",
        currentStep === 2 && type === "withdraw" && "bg-brand-green-pastel"
      )}
    >
      <CardContent
        className={cn(
          "space-y-4 text-black pt-6 transition-all duration-200",
          currentStep === 2
            ? status === RedeemStatus.ACCEPTED_BURNED
              ? "text-black"
              : "text-white"
            : ""
        )}
      >
        <div className="flex flex-col rounded-xl border-none gap-3">
          <div
            className={cn(
              "flex items-center justify-start gap-2.5",
              currentStep === 0 && "flex-col items-start"
            )}
          >
            {currentStep === 1 && (
              <LucideArrowLeft
                className="w-10 h-10 cursor-pointer border-2 border-black rounded-full p-2 bg-[#FBC858]"
                onClick={handleBack}
              />
            )}

            <h3
              className={cn(
                "text-xl font-helvetica font-bold",
                currentStep === 2
                  ? type === "redeem"
                    ? status === RedeemStatus.ACCEPTED_BURNED
                      ? "text-black"
                      : "text-white"
                    : "text-black"
                  : "text-black"
              )}
            >
              {t(Object.values(titles(type))[currentStep])}
            </h3>

            {currentStep === 0 && (
              <p className="text-sm text-black/50 font-helvetica">
                {t("availableBalance")}: {clpdBalanceFormatted} CLPD
              </p>
            )}
          </div>
          {
            createSteps({
              t,
              amount: withdrawAmount,
              handleAmountChange,
              bankInfo,
              addressDestination,
              setBankInfo,
              setAddressDestination,
              handleSubmit,
              status,
              type,
              setType,
              handleBack,
              errorFields,
              email: user?.email || "",
              handleMaxAmount,
            })[currentStep].children
          }
        </div>
      </CardContent>
      {currentStep !== 2 && (
        <CardFooter>
          <Button
            className="w-full bg-brand-blue-dark border-2 border-black shadow-brutalist-sm py-4 h-full text-xl hover:bg-brand-blue-dark/90 text-white font-helvetica font-bold"
            type="submit"
            form={
              currentStep === 0
                ? formIds.createOrder
                : type === "redeem"
                ? formIds.reedem
                : formIds.transfer
            }
            disabled={errorFields.includes("amount")}
          >
            {!loading ? (
              (() => {
                switch (currentStep) {
                  case 0:
                    return t("createWithdraw");
                  case 1:
                    return t("submit");
                }
              })()
            ) : (
              <LoadingSpinner />
            )}
          </Button>
        </CardFooter>
      )}

      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex justify-center my-2 space-x-2 bg-white w-full max-w-3xl rounded-full">
        {Object.keys(titles(type)).map((s) => (
          <div
            key={s}
            className={cn(
              "w-full h-2 rounded-full",
              parseInt(s) === currentStep && status !== RedeemStatus.ACCEPTED_BURNED
                ? "bg-black"
                : status === RedeemStatus.ACCEPTED_BURNED
                ? "bg-brand-green-pastel"
                : "bg-black/30",
              currentStep === 2 && type === "withdraw" && "bg-brand-green-pastel"
            )}
          />
        ))}
      </div>
    </Card>
  );
};

export default Withdraw;
