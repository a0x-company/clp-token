// ethers
import { ethers } from "ethers";

// viem
import { baseSepolia } from "viem/chains";

// constants
import CLPD_ABI from "@/constants/CLPD-abi.json";
import { contractAddress } from "@/constants/address";

// next
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log("[GET][/api/reserve]");

  try {
    const provider = new ethers.JsonRpcProvider(baseSepolia.rpcUrls.default.http[0]);
    const contract = new ethers.Contract(contractAddress, CLPD_ABI, provider);
    const supply = await contract.totalSupply();
    console.log("Supply obtenido:", supply.toString());
    const formattedSupply = ethers.formatUnits(supply, 18);
    return NextResponse.json({
      message: "Supply del token",
      supply: formattedSupply,
    });
  } catch (err) {
    console.error("Error al obtener el total supply del token:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
