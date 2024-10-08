"use client";

import React, { useEffect, useRef, useState } from "react";

// next
import Image from "next/image";
import Link from "next/link";

// http client
import axios from "axios";

// components
import ChartReserve from "./ChartReserve";

// tranlations
import { useTranslations } from "next-intl";

// constants
import { contractAddress } from "@/constants/address";

interface ReserveData {
  balance: number;
  timestamp: number;
}

const ABI = [
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
];

interface ReserveUIProps {
  bankBalance: number | null;
  tokenSupply: string | null;
}

const ReserveUI: React.FC<ReserveUIProps> = ({ bankBalance, tokenSupply }) => {
  const [isMatching, setIsMatching] = useState<boolean | null>(null);
  const [reserveData, setReserveData] = useState<ReserveData[]>([]);
  const fetchedData = useRef(false);

  const t = useTranslations("reserve");

  useEffect(() => {
    const fetchReserveData = async () => {
      try {
        const response = await axios.get(
          "https://development-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance/history?period=week",
          {
            headers: {
              "Content-Type": "application/json",
              "api-key": "a0xkey85vu5yu%1*",
            },
          }
        );
        setReserveData(response.data.balanceHistory);
        fetchedData.current = true;
      } catch (error) {
        console.error("Error al obtener los datos de reserva:", error);
      }
    };

    const fetchData = async () => {
      await Promise.all([fetchReserveData()]);
      setIsMatching(bankBalance === parseFloat(tokenSupply || "0"));
    };

    if (!fetchedData.current) fetchData();
  }, [reserveData, bankBalance, tokenSupply]);

  const boxStyle = " rounded-xl bg-white shadow-[4px_4px_0px_0px_#000] p-2 sm:p-8";
  const processedReserveData = reserveData
    .filter((item) => item.balance > 0)
    .map((item) => ({
      ...item,
      date: new Date(item.timestamp).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      time: new Date(item.timestamp).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  console.log(processedReserveData);

  const gradientStyle = { background: "linear-gradient(180deg, #06F 0%, #FFF 70%)" };
  return (
    <section className="flex flex-col w-full relative gap-16" style={gradientStyle}>
      <div className="flex flex-col h-auto px-6 lg:px-[64px] content-center items-center gap-8 lg:gap-[64px] pt-16 lg:pt-[120px] relative">
        <div className="flex flex-col max-md:w-full max-lg:w-[860px] w-[1080px] content-center items-center gap-[12px]">
          <p className="text-white font-romaben text-[40px] md:text-[72px] font-[400]">
            {t("secure")}
          </p>

          <p className="text-white font-helvetica text-[24px] font-bold text-center">
            {t("secure1")}
          </p>
          <p className="text-white font-helvetica text-[24px] text-center">{t("secure2")}</p>
        </div>
      </div>

      <div className="flex flex-row items-center justify-center w-full relative">
        <div className="flex flex-col max-md:w-[90vw] max-lg:w-[860px] w-[1080px] py-8 md:py-[64px] px-6 lg:px-16 xl:px-[140px] bg-white rounded-xl border-2 border-black shadow-brutalist">
          <h3 className="text-black text-4xl font-bold text-center">{t("composition")}</h3>
          <h4 className="text-black text-sm font-bold text-center">{t("realTime")}</h4>

          <div className="w-full h-0.5 my-8 dashed-border opacity-50" />

          <h4 className="text-black text-lg font-bold text-center">{t("balances")}</h4>

          <div className="w-full h-0.5 my-8 dashed-border opacity-50" />

          <div className={`flex items-center justify-center z-20 w-full gap-16`}>
            <div className="flex flex-col items-center">
              {bankBalance !== null ? (
                <p className="text-brand-blue font-helvetica text-[36px] font-bold">
                  $
                  {bankBalance.toLocaleString("es-ES", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              ) : (
                <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
              )}

              <h2 className="text-black font-romaben text-sm font-[400]">{t("inCirculation")}</h2>
              <div className="w-20 h-96 bg-brand-blue border-2 border-black shadow-brutalist-sm rounded-xl mt-6" />
            </div>

            <div className="flex flex-col items-center">
              {tokenSupply !== null ? (
                <p className="text-brand-blue font-helvetica text-[36px] font-bold">
                  $
                  {parseFloat(tokenSupply).toLocaleString("es-ES", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              ) : (
                <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
              )}

              <h2 className="text-black font-romaben text-sm font-[400]">{t("inReserve")}</h2>
              <div className="w-20 h-96 bg-brand-orange-pastel border-2 border-black shadow-brutalist-sm rounded-xl mt-6" />
            </div>
          </div>

          <div className="w-full h-0.5 my-8 dashed-border opacity-50" />

          <div className="flex flex-row items-center justify-center w-full gap-16">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-brand-blue rounded-full" />
              <p className="text-black font-helvetica text-sm">{t("CLPDCirculation")}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-brand-orange-pastel rounded-full" />
              <p className="text-black font-helvetica text-sm">{t("bankReserve")}</p>
            </div>
          </div>
        </div>

        <Image
          src="/images/reserve/waves-vector-2.svg"
          alt="Waves Vector"
          width={250}
          height={350}
          className="absolute bottom-0 left-0 max-md:max-w-[100px]"
        />
      </div>

      {/* Chart */}
      <ChartReserve activeData={processedReserveData} />

      <Image
        src="/images/reserve/waves-vector.svg"
        alt="Waves Vector"
        width={600}
        height={350}
        className="absolute -bottom-[175px] right-0 max-md:max-w-[300px]"
      />
    </section>
  );
};

export default ReserveUI;
