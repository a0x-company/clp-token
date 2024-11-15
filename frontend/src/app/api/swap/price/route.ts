// next
import { NextResponse } from "next/server";

// constants
import { addresses } from "@/constants/address";
import investmentAbi from "@/constants/investCLPD-abi.json";

// ethers
import { ethers } from "ethers";
import { formatUnits } from "viem";

const providerUrl = process.env.QUICKNODE_URL;

const getPrice = async () => {
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const investmentContract = new ethers.Contract(
    addresses.base.investment,
    investmentAbi,
    provider
  );

  try {
    const priceCLPDUSDCWithDecimals = await investmentContract.getPriceOfCLPDInUSDC();
    const priceUSDCCLPDWithDecimals = await investmentContract.getPriceOfUSDCInCLPD();

    const priceCLPDUSDC = Number(formatUnits(priceCLPDUSDCWithDecimals, 6));
    const priceUSDCCLPD = Number(formatUnits(priceUSDCCLPDWithDecimals, 18));

    console.log("Precio CLPD/USDC:", priceCLPDUSDC.toFixed(3));
    console.log("Precio USDC/CLPD:", priceUSDCCLPD.toFixed(3));

    return { priceCLPDUSDC, priceUSDCCLPD };
  } catch (error) {
    console.error("Error al obtener la información del token:", error);
    return { error: "Error fetching token price" };
  } finally {
    provider.destroy();
  }
};

export async function GET(request: Request) {
  console.info("[GET][/api/swap/price]");
  const idToken = request.headers.get("Authorization")?.split(" ")[1];

  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceCLPDUSDC, priceUSDCCLPD } = await getPrice();

    return NextResponse.json(
      { message: "✅ Price fetched successfully", data: { priceCLPDUSDC, priceUSDCCLPD } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching token price:", error);
    return NextResponse.json({ error: "Error fetching token price" }, { status: 500 });
  }
}
