"use client";

import React, { useEffect, useRef, useState } from "react";

// next
import Image from "next/image";

// http client
import axios from "axios";

// ethers

// recharts
import { useTranslations } from "next-intl";
import Link from "next/link";
import ChartReserve from "./ChartReserve";
import { contractAddress } from "@/app/api/reserve/route";

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

  const gradientStyle = { background: "linear-gradient(180deg, #06F 0%, #FFF 100%)" };
  return (
    <section className="flex flex-col w-full relative">
      <div className="flex flex-row items-center w-full relative" style={gradientStyle}>
        <Image
          src="/images/reserve/star-left.svg"
          alt="star-left"
          width={316}
          height={802}
          className="absolute max-md:hidden z-10"
        />

        <Image
          src="/images/reserve/star-top.svg"
          alt="star-left"
          width={802}
          height={316}
          className="absolute top-0 md:hidden z-10"
        />

        <div className="flex flex-col w-full md:py-[64px] px-6 lg:px-16 xl:px-[140px]">
          <div className="max-md:hidden w-full mb-8 z-20">
            <div className="inline-block bg-white p-[16px] border-2 border-black rounded-[12px] shadow-[4px_4px_0px_0px_#000]">
              <p className="text-black font-helvetica text-[20px] font-[700]">
                Balances en tiempo real *
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row w-full justify-between">
            <div
              className={`flex flex-col items-center md:items-start z-20 w-full max-md:mb-[15vh] md:w-[45%]`}
            >
              <h2 className="text-black font-romaben text-[64px] md:text-[128px] font-[400]">
                Banco
              </h2>

              {bankBalance !== null ? (
                <p className="text-black font-helvetica text-[48px] md:text-[128px] font-[400]">
                  $
                  {bankBalance.toLocaleString("es-ES", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              ) : (
                <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
              )}

              <div className="flex items-center justify-center gap-[8px]">
                <Image
                  src="/images/reserve/santander.png"
                  alt="Banco Santander Logo"
                  width={32}
                  height={32}
                  className="w-[32px] h-[32px] rounded-full border-2 border-black"
                />

                <p className="text-black font-helvetica text-xl lg:text-[24px] xl:text-[32px] font-[400]">
                  Total de Pesos en el Banco
                </p>
              </div>
            </div>

            <Image
              src="/images/reserve/divider.svg"
              alt="divider"
              width={8}
              height={32}
              className="max-md:hidden"
            />
            <div className="md:hidden w-full relative flex items-center">
              <div className="inline-block bg-white p-[16px] border-2 border-black rounded-[12px] shadow-[4px_4px_0px_0px_#000] self-center mx-auto z-10">
                <p className="text-black font-helvetica text-[20px] font-[700]">
                  Balances en tiempo real
                </p>
              </div>
              <Image
                src="/images/reserve/divider-mobile.svg"
                alt="divider"
                width={388}
                height={8}
                className="md:hidden self-center absolute bottom-1/2 translate-y-1/2"
              />
            </div>

            <div
              className={`flex flex-col items-center md:items-end z-20 w-full max-md:mt-[15vh] md:w-[45%]`}
            >
              <h2 className="text-black font-romaben text-[64px] md:text-[128px] font-[400]">
                Tokens
              </h2>

              {tokenSupply !== null ? (
                <p className="text-black font-helvetica text-[48px] md:text-[128px] font-[400]">
                  {parseFloat(tokenSupply).toLocaleString("es-ES", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              ) : (
                <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
              )}

              <Link href={`https://sepolia.basescan.org/token/${contractAddress}`} target="_blank">
                <div className="flex items-center justify-center gap-[8px] cursor-pointer">
                  <p className="text-black font-helvetica text-xl lg:text-[24px] xl:text-[32px] font-[400]">
                    Total de CLPD en la red Base
                  </p>

                  <Image
                    src="/images/reserve/base.png"
                    alt="Base Network Logo"
                    width={32}
                    height={32}
                    className="w-[32px] h-[32px] rounded-full border-2 border-black"
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>

        <Image
          src="/images/reserve/star-bottom.svg"
          alt="star-bottom"
          width={802}
          height={316}
          className="absolute bottom-0 md:hidden z-10"
        />

        <Image
          src="/images/reserve/star-right.svg"
          alt="star-right"
          width={316}
          height={802}
          className="absolute max-md:hidden right-0 z-10"
        />
      </div>

      <div className="flex flex-col h-auto px-6 lg:px-[64px] content-center items-center gap-8 lg:gap-[64px] py-16 lg:py-[120px] relative">
        <Image
          src="/images/reserve/secure.svg"
          alt="Banco Santander Logo"
          width={205}
          height={205}
        />

        <div className="flex flex-col max-md:w-full max-lg:w-[860px] w-[1080px] content-center items-center gap-[12px]">
          <p className="text-black font-romaben text-[40px] md:text-[64px] font-[400]">
            {t("secure")}
          </p>

          <p className="text-black font-helvetica text-[24px] md:text-[32px] font-[400] text-center">
            <span className="font-bold">{t("secure1")}</span> {t("secure2")}
          </p>
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
