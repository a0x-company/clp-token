// next
import { Metadata } from "next";

// http client
import axios from "axios";

//components
import ReserveUI from "@/components/reserve/ReserveUI";

// utils
import { formatNumber } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import FAQSection from "@/components/reserve/FAQSection";
import Footer from "@/components/Footer";

// wagmi
import { readContracts } from "@wagmi/core";

// provider
import { config } from "@/provider/config";

// constants
import { addresses } from "@/constants/address";

// viem
import { erc20Abi, formatUnits } from "viem";

export const fetchCache = "force-no-store";
export const dynamic = "auto";

const fetchBankBalance = async () => {
  try {
    const response = await axios.get(
      "https://development-clpd-vault-api-claucondor-61523929174.us-central1.run.app/vault/balance/storage"
    );
    return response.data.balance;
  } catch (error) {
    console.error("Error al obtener el balance del banco:", error);
  }
};

const fetchTokenSupply = async () => {
  try {
    const result = await readContracts(config, {
      allowFailure: false,
      contracts: [
        {
          address: addresses.base.CLPD.address,
          abi: erc20Abi,
          functionName: "totalSupply",
        },
      ],
    });

    const totalSupply = formatUnits(result[0]!, 18);

    return Number(totalSupply);
  } catch (error) {
    console.error("Error al obtener el total supply del token:", error);
  }
};

export async function generateMetadata(): Promise<Metadata> {
  let bankBalance = null;
  let tokenSupply = null;
  try {
    [bankBalance, tokenSupply] = await Promise.all([fetchBankBalance(), fetchTokenSupply()]);
  } catch (error) {
    console.error("Error al obtener los datos de reserva:", error);
  }
  if (!bankBalance || !tokenSupply) {
    return {
      title: "Reservas | CLPD",
      description: `Reservas de CLPD: $${bankBalance}`,
      openGraph: {
        images: [],
      },
    };
  }

  tokenSupply = formatNumber(tokenSupply);
  bankBalance = formatNumber(bankBalance);

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
  let bankBalance = null;
  let tokenSupply = null;
  try {
    [bankBalance, tokenSupply] = await Promise.all([fetchBankBalance(), fetchTokenSupply()]);
    console.log("bankBalance", bankBalance);
    console.log("tokenSupply", tokenSupply);
  } catch (error) {
    console.error("Error al obtener los datos de reserva:", error);
  }

  return (
    <main className="min-h-screen max-w-screen bg-white text-black">
      <Navbar />
      <ReserveUI bankBalance={bankBalance} tokenSupply={tokenSupply} />
      <FAQSection />
      <Footer />
    </main>
  );
}
