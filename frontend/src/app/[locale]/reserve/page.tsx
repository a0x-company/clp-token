"use client";

import React, { useEffect, useState } from "react";

// next
import Link from "next/link";
import Image from "next/image";

// http client
import axios from "axios";

// ethers
import { ethers } from "ethers";

// recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

export default function Reserve() {
  const [bankBalance, setBankBalance] = useState<number | null>(null);
  const [tokenSupply, setTokenSupply] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState<boolean | null>(null);

  const [reserveData, setReserveData] = useState<ReserveData[]>([]);

  useEffect(() => {
    const fetchBankBalance = async () => {
      try {
        const response = await axios.get(
          "https://development-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance/storage"
        );
        setBankBalance(response.data.balance);
      } catch (error) {
        console.error("Error al obtener el balance del banco:", error);
      }
    };

    const fetchTokenSupply = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          "https://eth-sepolia.public.blastapi.io"
        );
        const contractAddress = "0x28DAab58fFD02cc19A7E4655e1d6766023F5FeAC";
        const contract = new ethers.Contract(contractAddress, ABI, provider);

        const supply = await contract.totalSupply();
        const formattedSupply = ethers.utils.formatUnits(supply, 18);

        console.log("formattedSupply", formattedSupply);
        setTokenSupply(formattedSupply);
      } catch (error) {
        console.error("Error al obtener el total supply del token:", error);
      }
    };

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
      } catch (error) {
        console.error("Error al obtener los datos de reserva:", error);
      }
    };

    const fetchData = async () => {
      await Promise.all([fetchBankBalance(), fetchTokenSupply(), fetchReserveData()]);
      setIsMatching(bankBalance === parseFloat(tokenSupply || "0"));
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, [bankBalance, tokenSupply, reserveData]);

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

  const gradientStyle = { background: "linear-gradient(180deg, #06F 0%, #FFF 100%)" };

  return (
    <main className="flex flex-col w-full">
      <div className="flex flex-row items-center w-full relative" style={gradientStyle}>
        <Image
          src="/images/reserve/star-left.svg"
          alt="star-left"
          width={316}
          height={802}
          className="absolute z-10"
        />

        <div className="flex flex-col w-full py-[64px] px-[140px]">
          <div className="w-full mb-8 z-20">
            <div className="inline-block bg-white p-[16px] border-2 border-black rounded-[12px] shadow-[4px_4px_0px_0px_#000]">
              <p className="text-black font-helvetica text-[20px] font-[700]">
                Balances en tiempo real *
              </p>
            </div>
          </div>

          <div className="flex flex-row w-full justify-between">
            <div className={`flex flex-col items-start z-20 w-[45%]`}>
              <h2 className="text-black font-romaben text-[128px] font-[400]">Banco</h2>

              {bankBalance !== null ? (
                <p className="text-black font-helvetica text-[128px] font-[400]">
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

                <p className="text-black font-helvetica text-[32px] font-[400]">
                  Total de Pesos en el Banco
                </p>
              </div>
            </div>

            <Image src="/images/reserve/divider.svg" alt="divider" width={8} height={32} />

            <div className={`flex flex-col items-end z-20 w-[45%]`}>
              <h2 className="text-black font-romaben text-[128px] font-[400]">Tokens</h2>

              {tokenSupply !== null ? (
                <p className="text-black font-helvetica text-[128px] font-[400]">
                  {parseFloat(tokenSupply).toLocaleString("es-ES", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              ) : (
                <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
              )}

              <Link
                href="https://sepolia.basescan.org/token/0x28DAab58fFD02cc19A7E4655e1d6766023F5FeAC"
                target="_blank"
              >
                <div className="flex items-center justify-center gap-[8px] cursor-pointer">
                  <p className="text-black font-helvetica text-[32px] font-[400]">
                    Total de CLPa en la red Base
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
          src="/images/reserve/star-right.svg"
          alt="star-right"
          width={316}
          height={802}
          className="absolute right-0 z-10"
        />
      </div>

      <div className="flex flex-col h-[520px] px-[64px] content-center items-center gap-[64px]">
        <Image
          src="/images/reserve/secure.svg"
          alt="Banco Santander Logo"
          width={205}
          height={205}
        />

        <div className="flex flex-col w-[860px] content-center items-center gap-[12px]">
          <p className="text-black font-romaben text-[64px] font-[400]">Tu respaldo</p>

          <p className="text-black font-helvetica text-[32px] font-[400] ">
            CLPa está respaldada 100% en pesos chilenos, garantizando que cada token emitido tenga
            un equivalente exacto en pesos chilenos depositada en un banco en Chile.
          </p>
        </div>
      </div>
    </main>
  );
}
