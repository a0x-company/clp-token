"use client";

import React, { useEffect, useRef, useState } from "react";

// next
import Image from "next/image";

// http client
import axios from "axios";

// components
import ChartReserve from "./ChartReserve";

// tranlations
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

// constants
import { addresses } from "@/constants/address";

// recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { useMediaQuery } from "react-responsive";

interface ReserveData {
  balance: number;
  timestamp: number;
}

interface ReserveUIProps {
  bankBalance: number | null;
  tokenSupply: number | null | undefined;
}

const ReserveUI: React.FC<ReserveUIProps> = ({ bankBalance, tokenSupply }) => {
  const [reserveData, setReserveData] = useState<ReserveData[]>([]);
  const fetchedData = useRef(false);

  // const result = useReadContracts({
  //   allowFailure: true,
  //   contracts: [
  //     {
  //       address: addresses.base.CLPD.address,
  //       abi: erc20Abi,
  //       functionName: "totalSupply",
  //     },
  //   ],
  // });

  // console.log("result", result.data);

  const t = useTranslations("reserve");

  const isMobile = useMediaQuery({ maxWidth: 767 });

  useEffect(() => {
    const fetchReserveData = async () => {
      try {
        const response = await axios.get("/api/reserve/historic");
        setReserveData(response.data.balanceHistory);
        fetchedData.current = true;
      } catch (error) {
        console.error("Error al obtener los datos de reserva:", error);
      }
    };

    const fetchData = async () => {
      await Promise.all([fetchReserveData()]);
    };

    if (!fetchedData.current) fetchData();
  }, [reserveData, bankBalance, tokenSupply]);

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

  const gradientStyle = { background: "linear-gradient(180deg, #06F 0%, #FFF 70%)" };

  const data = [
    {
      name: t("inCirculation"),
      value: tokenSupply || 0,
      fill: "#0267FF",
      subtitle: "En el banco",
    },
    {
      name: t("inReserve"),
      value: bankBalance || 0,
      fill: "#EF5D52",
      subtitle: "En circulación",
    },
  ];

  const CustomBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    const barWidth = isMobile ? width * 0.7 : width * 0.5;
    const xOffset = (width - barWidth) / 2;

    return (
      <g>
        <defs>
          <filter id="dropShadow">
            <feDropShadow dx="4" dy="4" stdDeviation="0" floodColor="#000" floodOpacity="1" />
          </filter>
        </defs>

        <rect
          x={x + xOffset}
          y={y}
          width={barWidth}
          height={height}
          fill={fill}
          stroke="#000"
          strokeWidth="1"
          filter="url(#dropShadow)"
          rx={12}
          ry={12}
        />
      </g>
    );
  };

  return (
    <section className="flex flex-col w-full relative gap-16" style={gradientStyle}>
      <div className="flex flex-col h-auto px-6 lg:px-[64px] content-center items-center gap-8 lg:gap-[64px] pt-16 lg:pt-[120px] relative">
        <div className="flex flex-col max-md:w-full max-lg:w-[860px] w-[1080px] content-center items-center gap-[12px]">
          <p className="text-white font-beauford text-[40px] md:text-[72px] font-[400]">
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

          <div className="flex flex-row items-center justify-center w-full gap-[20px] md:gap-16 mb-8">
            <div className="flex flex-col items-center">
              {tokenSupply !== null ? (
                <p className="text-brand-blue font-helvetica text-[36px] font-bold">
                  {tokenSupply !== undefined
                    ? tokenSupply.toLocaleString("es-ES", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    : "0"}
                </p>
              ) : (
                <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
              )}

              <h2 className="text-black text-sm font-[400]">{t("inCirculation")}</h2>
            </div>

            <div className="flex flex-col items-center">
              {bankBalance !== null ? (
                <p className="text-[#EF5D52] font-helvetica text-[36px] font-bold">
                  $
                  {bankBalance.toLocaleString("es-ES", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              ) : (
                <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
              )}

              <h2 className="text-black text-sm font-[400]">{t("inReserve")}</h2>
            </div>
          </div>

          <div className="w-full h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={isMobile ? { left: 0, right: 0 } : { left: 20, right: 20 }}
              >
                <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />

                <YAxis
                  type="number"
                  tick={isMobile ? false : {}}
                  axisLine={isMobile ? false : {}}
                  width={isMobile ? 0 : 60}
                />

                <Tooltip
                  content={({ payload, label }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border border-gray-300 rounded shadow">
                          <p className="font-bold">{data.name}</p>
                          <p>{data.value.toLocaleString("es-ES")}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Bar dataKey="value" shape={<CustomBar />} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full h-0.5 my-8 dashed-border opacity-50" />

          <div className="flex flex-row items-center justify-center w-full gap-[20px] md:gap-16">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-brand-blue rounded-full" />
              <p className="text-black font-helvetica text-sm">{t("CLPDCirculation")}</p>
              <Link
                href={`https://basescan.org/token/${addresses.base.CLPD.address}`}
                target="_blank"
                className="group"
              >
                <ExternalLink
                  size={16}
                  className="group-hover:text-brand-blue transition-all duration-300"
                />
              </Link>
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
          className="absolute bottom-0 left-0 max-md:max-w-[100px] hidden md:block"
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
