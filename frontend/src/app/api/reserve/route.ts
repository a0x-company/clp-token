import { ethers } from "ethers";
import { baseSepolia, sepolia } from "viem/chains";

import CLPD_ABI from "@/constants/CLPD-abi.json";
import { NextResponse } from "next/server";

export const contractAddress = "0xbEA4c5A2515A6D9bF4A4175af336663FB8976031";

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
