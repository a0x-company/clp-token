"use client";

import React, { useEffect, useState } from "react";

// next
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

  const boxStyle =
    "border-2 border-black rounded-xl bg-white shadow-[4px_4px_0px_0px_#000] p-2 sm:p-8";

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

  return (
    <main className="max-w-4xl mx-auto">
      <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-100">
        <div className={`${boxStyle} mb-12 flex flex-col md:flex-row items-start`}>
          <div className="md:w-1/2 pr-8">
            <h2 className="text-3xl font-bold mb-6 text-left font-romaben">
              Respaldo de Nuestra Stablecoin
            </h2>
            <p className="text-lg leading-relaxed text-gray-700 mb-6">
              Nuestra stablecoin está respaldada al 100% en pesos chilenos, garantizando que cada
              token emitido tenga un equivalente exacto en pesos chilenos depositada en un banco en
              Chile 🇨🇱 (cuenta bancaria de reserva)
            </p>
          </div>

          <div className="md:w-1/2 bg-gray-100 p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <h3 className="text-xl font-semibold mb-4">Proceso de Respaldo:</h3>
            <ul className="space-y-3 text-gray-700 text-left">
              <li className="flex items-start">
                <span className="mr-2 font-bold">1.</span>
                <span>Depósito de pesos chilenos por usuarios con cuenta bancaria chilena.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">2.</span>
                <span>La empresa actúa como custodio de los fondos.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">3.</span>
                <span>Almacenamiento seguro y consulta disponible en todo momento.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-bold">4.</span>
                <span>
                  Transparencia total sobre el respaldo de los tokens ACLP en circulación.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className={`${boxStyle} text-center`}>
            <h2 className="text-2xl font-semibold mb-4 font-romaben">Cuenta del banco</h2>
            {bankBalance !== null ? (
              <p className="text-5xl font-bold text-black font-helvetica">
                $
                {bankBalance.toLocaleString("es-ES", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            ) : (
              <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
            )}
            <div className="mt-4 flex items-center justify-center">
              <Image
                src="/reserve/santander.png"
                alt="Banco Santander Logo"
                width={50}
                height={50}
                className="w-10 h-10 rounded-full border-2 border-black"
              />
              <p className="ml-2 text-sm text-gray-600 font-romaben">
                Cuenta en Banco Santander Chile
              </p>
            </div>
          </div>
          <div className={`${boxStyle} text-center`}>
            <h2 className="text-2xl font-semibold mb-4 font-romaben">Cantidad de tokens CLPa</h2>
            {tokenSupply !== null ? (
              <p className="text-5xl font-bold text-blue-600 font-helvetica">
                {parseFloat(tokenSupply).toLocaleString("es-ES", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            ) : (
              <p className="text-2xl text-gray-500 font-helvetica">Cargando...</p>
            )}
            <div className="mt-4 flex items-center justify-center">
              <Image
                src="/reserve/base.png"
                alt="Base Network Logo"
                width={50}
                height={50}
                className="w-10 h-10 rounded-full border-2 border-black"
              />
              <p className="ml-2 text-sm text-gray-600 font-helvetica">
                Token deployado en la red de Base
              </p>
            </div>
          </div>
        </div>

        {isMatching !== null && (
          <div
            className={`mt-8 ${boxStyle} ${isMatching ? "bg-green-300" : "bg-red-300"} text-center`}
          >
            <p className="text-xl font-semibold font-helvetica">
              {isMatching ? "Los valores coinciden ✅" : "Los valores no coinciden ❌"}
            </p>
          </div>
        )}

        <div className={`mt-12 ${boxStyle}`}>
          <h2 className="text-2xl font-semibold mb-6 font-romaben text-center">
            Historial del balance en la cuenta de reserva
          </h2>

          <div className="balance-history-chart w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processedReserveData}
                margin={{
                  top: 5,
                  right: 5,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickLine={{ stroke: "#666" }}
                />
                <YAxis
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickLine={{ stroke: "#666" }}
                  tickFormatter={(value) => `$${value.toLocaleString("es-ES")}`}
                />

                <Tooltip
                  formatter={(value) => [`$${(value as number).toLocaleString("es-ES")}`, "Saldo"]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${payload[0].payload.date} ${payload[0].payload.time}`;
                    }
                    return label;
                  }}
                  labelStyle={{ color: "#666" }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "10px",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#0000FF"
                  strokeWidth={3}
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}
