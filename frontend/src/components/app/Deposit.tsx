"use client";
// react
import { useState } from "react";

//components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

// icons
import { useTranslations } from "next-intl";
import Image from "next/image";
import CLPFlag from "../CLPFlag";
import { Input } from "../ui/input";
import CreateOrder from "./CreateOrder";
import { cn, formatNumber } from "@/lib/utils";
import { useUserStore } from "@/context/global-store";
import { web3AuthInstance } from "@/provider/WagmiConfig";
import axios from "axios";
import { LoadingSpinner } from "../ui/spinner";
import { useDepositStatus } from "@/hooks/useDepositStatus";
import { DepositStatus } from "@/types";
import { LucideArrowLeft, PencilLine } from "lucide-react";

const currencies = {
  CLP: { name: "Peso Chileno", code: "CL" },
};

const bankInfo = {
  name: "Banco Santander",
  accountType: "Cuenta Vista",
  owner: "Cristian Ignacio Valdivia Ramirez",
  accountNumber: "0-070-08-99853-6",
  email: "c@mistokens.com",
};

interface CreateStepsProps {
  t: any;
  amount: string;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  email: string;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
  status: DepositStatus | null;
  handleBack: () => void;
}

const formIds = {
  createOrder: "create-order",
  sendProof: "send-proof",
};

const titles = {
  0: "deposit",
  1: "depositStep1",
  2: "step3",
};

const createSteps = ({
  t,
  amount,
  handleAmountChange,
  handleFileChange,
  file,
  email,
  handleSubmit,
  handleBack,
  status,
}: CreateStepsProps) => [
  {
    step: 0,
    title: t("deposit"),
    description: "Description 1",
    children: (
      <form id={formIds.createOrder} onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="grid w-full items-center gap-1.5 bg-[#F0FCFF] rounded-md p-3 border-2 border-black shadow-brutalist-sm">
          <label htmlFor="amount" className="font-bold text-base">
            {t("send")}
          </label>
          <div className="flex items-center gap-4 relative">
            <Input
              type="number"
              id="amount"
              placeholder={t("amountPlaceholder")}
              value={amount}
              onChange={handleAmountChange}
              className="bg-transparent text-black text-[32px] font-helvetica border-none p-0 focus:outline-none"
            />

            <CLPFlag type="CLP" />
          </div>
        </div>

        <Image
          src="/images/app/arrow-down.svg"
          alt="arrow-down"
          width={32}
          height={32}
          className="mx-auto"
        />

        <div className="grid w-full items-center gap-1.5 bg-[#F0FCFF] rounded-md p-3 border-2 border-black shadow-brutalist-sm">
          <label htmlFor="amount" className="font-bold text-base">
            {t("receive")}
          </label>
          <div className="flex items-center gap-4 relative">
            <p className="bg-transparent text-black text-[32px] font-helvetica w-full border-none focus:outline-none">
              {amount || "0"}
            </p>

            <CLPFlag type="CLPD" />
          </div>
        </div>

        <h3 className="text-xl font-helvetica font-bold">{t("depositSubtitle")}</h3>

        <div className="flex gap-2 border-2 border-black rounded-md p-3">
          <Image
            src={"/images/reserve/santander.png"}
            alt={"Santander Logo"}
            width={48}
            height={48}
            className="rounded-full overflow-hidden border-2 border-black h-12 w-12"
          />

          <div className="flex flex-col items-start justify-center">
            <p className="font-bold font-helvetica text-base">{t("transferBank")}</p>
            <p className="font-helvetica text-black text-sm">{bankInfo.name}</p>
          </div>
        </div>
      </form>
    ),
    formId: formIds.createOrder,
    status,
  },
  {
    step: 1,
    title: t("depositStep1"),
    description: "Description 2",
    children: (
      <form id={formIds.sendProof} onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 border-2 border-gray-300 rounded-md p-3 font-helvetica">
          <div className="flex items-center gap-2">
            <Image
              src={"/images/reserve/santander.png"}
              alt={"Santander Logo"}
              width={48}
              height={48}
              className="rounded-full overflow-hidden border-2 border-black h-12 w-12"
            />
            <p className=" text-black text-xl font-bold">{bankInfo.name}</p>
          </div>
          <p className="flex items-center justify-between">
            <strong>{t("bankInfo.type")}:</strong> {bankInfo.accountType}
          </p>
          <p className="flex items-center justify-between">
            <strong>{t("bankInfo.accountNumber")}:</strong> {bankInfo.accountNumber}
          </p>
          <p className="flex items-center justify-between">
            <strong>{t("bankInfo.owner")}:</strong> {bankInfo.owner}
          </p>
          <p className="flex items-center justify-between">
            <strong>{t("bankInfo.email")}:</strong> {bankInfo.email}
          </p>
        </div>
        <CreateOrder handleFileChange={handleFileChange} file={file} />
        <div className="flex items-center gap-2">
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
    formId: formIds.sendProof,
  },
  {
    step: 2,
    title: status === DepositStatus.ACCEPTED_MINTED ? t("step3Minted") : t("step3"),
    description: "Description 3",
    children: (
      <div className="flex flex-col items-start justify-center gap-2">
        <Image
          src={
            status === DepositStatus.ACCEPTED_MINTED
              ? "/images/app/success-gif.gif"
              : "/images/app/wired-gif.gif"
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
            status === DepositStatus.ACCEPTED_MINTED && "font-bold text-black"
          )}
        >
          {status === DepositStatus.ACCEPTED_MINTED
            ? t("step3MintedDescription")
            : t("step3Description")}
        </p>
        <p
          className={cn(
            "text-base text-white/50 font-helvetica text-start",
            status === DepositStatus.ACCEPTED_MINTED && "font-bold text-black/50"
          )}
        >
          {status === DepositStatus.ACCEPTED_MINTED
            ? `${t("step3MintedBalance")}: ${amount} CLPD`
            : `${t("yourEmail")}: ${email}`}
        </p>
      </div>
    ),
  },
];

import { useEffect } from "react";

const Deposit: React.FC = () => {
  const t = useTranslations("deposit");

  const [amount, setAmount] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [depositId, setDepositId] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);

  const { user } = useUserStore();
  const { status, loading: statusLoading, error, refetch } = useDepositStatus(depositId);

  useEffect(() => {
    const savedDepositId = localStorage.getItem("depositId");
    if (savedDepositId) {
      setDepositId(savedDepositId);
      refetch();
    }
  }, []);

  useEffect(() => {
    if (status === DepositStatus.PENDING && currentStep === 0) {
      setCurrentStep(2);
    }
  }, [status, currentStep]);

  useEffect(() => {
    if (status !== DepositStatus.PENDING) {
      setCurrentStep(0);
      localStorage.removeItem("depositId");
    }
  }, [status]);

  const saveDepositIdToLocalStorage = (id: string) => {
    localStorage.setItem("depositId", id);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    value = value.replace(/[^0-9]/g, "");

    if (value.length > 1 && value.startsWith("0")) {
      value = value.replace(/^0+/, "");
    }

    setAmount(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const userInfo = await web3AuthInstance.getUserInfo();
    const idToken = userInfo?.idToken;
    console.log(currentStep);
    switch (currentStep) {
      case 0:
        // setCurrentStep(1);
        if (amount === "" || !amount || Number(amount) === 0) {
          setLoading(false);
          return;
        }
        try {
          const response = await axios.post(
            "/api/deposit/create-order",
            { amount },
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log(response);
          if (response.status === 201 || response.status === 200) {
            console.log("Deposito:", response.data.depositId);
            setDepositId(response.data.depositId);
            saveDepositIdToLocalStorage(response.data.depositId);
            setCurrentStep(1);
          }
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
        break;
      case 1:
        // setCurrentStep(2);
        if (!file) {
          setLoading(false);
          return;
        }
        try {
          console.log("Archivo:", file);
          console.log("Monto:", amount);
          console.log("Deposito:", depositId);
          const response = await axios.post(
            "/api/deposit/create-order/proof",
            { file, depositId },
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
          console.log(response);
          if (response.status === 201 || response.status === 200) {
            setFile(null);
            handleAmountChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
            setCurrentStep(2);
          }
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
        break;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      let file = event.target.files[0];
      let extension = file.name.split(".").pop();
      let newName = file.name.replace(/\s+/g, "-").replace(/\.[^.]+$/, "") + "." + extension;
      let newFile = new File([file], newName, { type: file.type });
      console.log(newFile);
      setFile(newFile);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setDepositId("");
    setFile(null);
    setAmount("");
    localStorage.removeItem("depositId");
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Card
      className={cn(
        "absolute left-1/2 -translate-x-1/2 max-md:bottom-[25%] md:top-1/2 md:-translate-y-1/2 w-full max-w-xl bg-white border-2 border-black rounded-xl shadow-brutalist max-md:w-[90%]",
        currentStep === 2 && status !== DepositStatus.ACCEPTED_MINTED
          ? "bg-brand-blue"
          : currentStep === 2 && status === DepositStatus.ACCEPTED_MINTED
          ? "bg-brand-green-pastel"
          : "h-auto"
      )}
    >
      <CardContent
        className={cn(
          "space-y-4 text-black pt-6",
          currentStep === 2
            ? status === DepositStatus.ACCEPTED_MINTED
              ? "text-black"
              : "text-white"
            : ""
        )}
      >
        <div className="flex flex-col rounded-xl border-none gap-3">
          <div className="flex items-center justify-start gap-2.5">
            {currentStep === 1 && (
              <LucideArrowLeft
                className="w-10 h-10 cursor-pointer border-2 border-black rounded-full p-2 bg-[#FBC858]"
                onClick={handleBack}
              />
            )}

            <h3 className="text-xl font-helvetica font-bold">
              {t(Object.values(titles)[currentStep])}
            </h3>
          </div>
          <CardContent className="p-0 space-y-2">
            {
              createSteps({
                t,
                amount,
                handleAmountChange,
                email: user?.email || "",
                handleSubmit,
                handleFileChange,
                file,
                status,
                handleBack,
              })[currentStep].children
            }
          </CardContent>
        </div>
      </CardContent>

      {currentStep !== 2 && (
        <CardFooter>
          <Button
            className="w-full bg-brand-blue-dark border-2 border-black shadow-brutalist-sm py-4 h-full text-xl hover:bg-brand-blue-dark/90 text-white font-helvetica font-bold"
            type="submit"
            form={Object.values(formIds)[currentStep]}
          >
            {!loading ? (
              (() => {
                switch (currentStep) {
                  case 0:
                    return t("createOrder");
                  case 1:
                    return t("sendOrder");
                }
              })()
            ) : (
              <LoadingSpinner />
            )}
          </Button>
        </CardFooter>
      )}

      {currentStep === 2 && status === DepositStatus.ACCEPTED_MINTED && (
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
        {Object.keys(titles).map((s) => (
          <div
            key={s}
            className={`w-full h-2 rounded-full ${
              parseInt(s) === currentStep && status !== DepositStatus.ACCEPTED_MINTED
                ? "bg-black"
                : status === DepositStatus.ACCEPTED_MINTED && currentStep === 2
                ? "bg-brand-green-pastel"
                : "bg-black/30"
            }`}
          />
        ))}
      </div>
    </Card>
  );
};

export default Deposit;
