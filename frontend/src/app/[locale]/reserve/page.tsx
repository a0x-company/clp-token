// next

// http client
import axios from "axios";

// ethers
import { ethers } from "ethers";

//components
import ReserveUI from "@/components/reserve/ReserveUI";

// constants
import CLPD_ABI from "@/constants/CLPD-abi.json";
import { sepolia } from "viem/chains";
import { Metadata } from "next";
import { formatNumber } from "@/lib/utils";

interface ReserveData {
  balance: number;
  timestamp: number;
}

const fetchBankBalance = async () => {
  try {
    const response = await axios.get(
      "https://development-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance/storage"
    );
    return response.data.balance;
  } catch (error) {
    console.error("Error al obtener el balance del banco:", error);
  }
};

const fetchTokenSupply = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_URL}/api/reserve`);
    return response.data.supply;
  } catch (error) {
    console.error("Error al obtener el total supply del token:");
  }
};

export async function generateMetadata(): Promise<Metadata> {
  let bankBalance = await fetchBankBalance();
  let tokenSupply = await fetchTokenSupply();
  if (!bankBalance || !tokenSupply) {
    return {
      title: "Reservas | CLPD",
      description: `Reservas de CLPD: $${bankBalance}`,
      openGraph: {
        images: [],
      },
    };
  }

  if (typeof tokenSupply === "string") {
    tokenSupply = formatNumber(Number(tokenSupply));
  }
  if (typeof bankBalance === "string") {
    bankBalance = formatNumber(Number(bankBalance));
  }
  const imageUrl = `${process.env.NEXT_PUBLIC_URL}/api/og-reserve?bankBalance=${bankBalance}&tokenSupply=${tokenSupply}`;
  return {
    title: "Reservas | CLPD",
    description: `Reservas de CLPD: $${bankBalance}`,
    openGraph: {
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
  };
}

export default async function Reserve() {
  let bankBalance: number | null = null;
  let tokenSupply: string | null = null;
  try {
    bankBalance = await fetchBankBalance();
    tokenSupply = await fetchTokenSupply();
    console.log("tokenSupply", tokenSupply);
  } catch (error) {
    console.error("Error al obtener los datos de reserva:", error);
  }

  return (
    <main className="max-w-4xl mx-auto">
      <ReserveUI bankBalance={bankBalance} tokenSupply={tokenSupply} />
    </main>
  );
}
