// jose
import * as jose from "jose";

// eccrypto
import { getPublicCompressed } from "@toruslabs/eccrypto";

// constants
import investmentAbi from "@/constants/investCLPD-abi.json";
import { addresses } from "@/constants/address";

// next
import { NextResponse } from "next/server";

// crypto
import crypto from "crypto";
import { ethers, formatUnits, parseEther } from "ethers";

// viem
import { base } from "viem/chains";
import { erc20Abi, formatEther, parseUnits } from "viem";
import { createPublicClient, http } from "viem";

export const maxDuration = 25;

const checkAllowance = async (
  userAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
  provider: ethers.JsonRpcProvider
) => {
  const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
  const allowance = await contract.allowance(userAddress, spenderAddress);
  return allowance;
};

const approve = async (
  contractAddress: `0x${string}`,
  amount: string,
  contractWithSigner: ethers.Contract
) => {
  console.log("contractWithSigner", contractWithSigner);
  const tx = await contractWithSigner.approve(contractAddress, amount);
  return tx;
};

async function getGasPriceBaseViem(): Promise<BigInt> {
  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  const gasPrice = await client.getGasPrice();
  return BigInt(gasPrice);
}

let MINIMUM_ETH_BALANCE = 0.000006 * 5;

async function checkAndRechargeEthBalance(userAddress: string, provider: ethers.JsonRpcProvider) {
  const balanceETH = await provider.getBalance(userAddress);
  console.log("💰 ETH balance en la billetera del usuario:", formatEther(balanceETH));

  if (Number(formatEther(balanceETH)) < MINIMUM_ETH_BALANCE) {
    console.log("❌ Balance de ETH insuficiente en la billetera del usuario");

    const pkRechargeEthCldp = process.env.PK_RECHARGE_ETH_CLPD;

    if (!pkRechargeEthCldp) {
      console.log("❌ PK_RECHARGE_ETH_CLPD no encontrada");
      throw new Error("❌ PK_RECHARGE_ETH_CLPD no encontrada");
    }

    const walletRecharge = new ethers.Wallet(pkRechargeEthCldp, provider);

    const amountToSend = parseFloat((MINIMUM_ETH_BALANCE * 5).toFixed(6));

    const tx = {
      to: userAddress,
      value: parseEther(amountToSend.toString()),
    };

    try {
      const transactionResponse = await walletRecharge.sendTransaction(tx);
      await transactionResponse.wait();

      console.log("✅ Recarga de ETH a la billetera del usuario completada con éxito");
      console.log("🧾 Hash de la transacción:", transactionResponse.hash);
    } catch (error) {
      console.error("❌ La transacción de recarga falló:", error);
      throw new Error("❌ La transacción de recarga falló");
    }
  }
}

async function handleTransaction(
  transactionFunction: () => Promise<any>,
  userAddress: string,
  provider: ethers.JsonRpcProvider
) {
  try {
    return await transactionFunction();
  } catch (error: any) {
    if (
      error.code === "INSUFFICIENT_FUNDS" &&
      error.message.includes("insufficient funds for gas")
    ) {
      console.log("❌ Error de fondos insuficientes para gas. Aumentando MINIMUM_ETH_BALANCE.");
      MINIMUM_ETH_BALANCE *= 1.4; // Aumenta en un 40%
      console.log("Nuevo MINIMUM_ETH_BALANCE:", MINIMUM_ETH_BALANCE);

      await checkAndRechargeEthBalance(userAddress, provider);
      return await transactionFunction();
    }
    throw error;
  }
}

export async function POST(request: Request) {
  console.info(`[POST][/api/swap]`);
  const {
    userAddress,
    tokenIn,
    amountIn,
    encryptedPKey,
    iv,
  }: {
    userAddress: `0x${string}`;
    tokenIn: "USDC" | "CLPD";
    amountIn: number;
    encryptedPKey: string;
    iv: string;
  } = await request.json();

  const idToken = request.headers.get("Authorization")?.split(" ")[1];
  const encryptionKey = request.headers.get("X-Encryption-Key") as string;

  if (!userAddress || !idToken || !encryptedPKey || !tokenIn || !amountIn) {
    return NextResponse.json(
      { error: "userAddress, address, idToken, and encryptedPKey are required" },
      { status: 400 }
    );
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey, "hex"),
    Buffer.from(iv, "hex")
  );

  let pKey = decipher.update(encryptedPKey, "hex", "utf8");
  pKey += decipher.final("utf8");

  try {
    const appPubKey = getPublicCompressed(Buffer.from(pKey.padStart(64, "0"), "hex")).toString(
      "hex"
    );

    const jwks = jose.createRemoteJWKSet(new URL("https://api-auth.web3auth.io/jwks"));

    const jwtDecoded = await jose.jwtVerify(idToken, jwks, {
      algorithms: ["ES256"],
    });

    const verifiedWallet = (jwtDecoded.payload as any).wallets.find(
      (x: { type: string }) => x.type === "web3auth_app_key"
    );

    if (!verifiedWallet || verifiedWallet.public_key.toLowerCase() !== appPubKey.toLowerCase()) {
      return NextResponse.json({ error: "Verification Failed" }, { status: 400 });
    }

    const userPrivateKey = pKey;

    // Check if user has enough USDC balance
    const provider = new ethers.JsonRpcProvider(base.rpcUrls.default.http[0]);
    const contractUSDC = new ethers.Contract(addresses.base.USDC.address, erc20Abi, provider);
    const contractCLPD = new ethers.Contract(addresses.base.CLPD.address, erc20Abi, provider);
    // const balanceUSDC = await contractUSDC.balanceOf(userAddress);
    // const balanceCLPD = await contractCLPD.balanceOf(userAddress);
    const balanceTokenIn =
      tokenIn === "USDC"
        ? await contractUSDC.balanceOf(userAddress)
        : await contractCLPD.balanceOf(userAddress);

    console.log("💰 Swap amount:", amountIn);
    console.log(
      `💰 User ${tokenIn} balance:`,
      formatUnits(balanceTokenIn, addresses.base[tokenIn].decimals)
    );

    if (amountIn > Number(formatUnits(balanceTokenIn, addresses.base[tokenIn].decimals))) {
      console.log("❌ Insufficient USDC balance");
      return NextResponse.json({ error: "❌ Insufficient USDC balance" }, { status: 400 });
    }

    const balanceETH = await provider.getBalance(userAddress);
    console.log("💰 ETH balance in user wallet:", formatEther(balanceETH));

    await checkAndRechargeEthBalance(userAddress, provider);

    const wallet = new ethers.Wallet(userPrivateKey, provider);

    const contractWithSignerTokenIn: any =
      tokenIn === "USDC" ? contractUSDC.connect(wallet) : contractCLPD.connect(wallet);

    const amountWithDecimals = parseUnits(amountIn.toString(), addresses.base[tokenIn].decimals);
    const amountApprove = parseUnits("100000000000", addresses.base[tokenIn].decimals);

    const allowance = await checkAllowance(
      userAddress,
      addresses.base[tokenIn].address,
      addresses.base.investment,
      provider
    );

    console.log("💰 Allowance:", allowance);
    console.log("💰 Amount with decimals:", amountWithDecimals);

    if (Number(allowance) < amountWithDecimals) {
      console.log("💰 Approving", tokenIn);
      try {
        const tx = await approve(
          addresses.base.investment,
          amountApprove.toString(),
          contractWithSignerTokenIn
        );
        await tx.wait();

        console.log("✅ Approve confirmed");
        console.log("🧾 Transaction hash:", tx.hash);
      } catch (error) {
        console.error("❌ Transaction failed:", error);
        return NextResponse.json({ error: "❌ Transaction failed" }, { status: 400 });
      }
    }

    /* Contract swap */
    const contractSwap = new ethers.Contract(addresses.base.investment, investmentAbi, wallet);

    const contractSwapWithSigner = contractSwap.connect(wallet) as any;

    const gasPrice = await getGasPriceBaseViem();

    console.log("💰 Gas price:", gasPrice);

    try {
      console.log(`Iniciando swap con ${tokenIn}:`, amountIn);
      const tokenInAddress =
        tokenIn === "USDC" ? addresses.base.USDC.address : addresses.base.CLPD.address;
      const tokenOutAddress =
        tokenIn === "USDC" ? addresses.base.CLPD.address : addresses.base.USDC.address;
      const tx = await handleTransaction(
        async () => {
          return await contractSwapWithSigner.swapTokens(
            tokenInAddress,
            tokenOutAddress,
            amountWithDecimals,
            {
              gasLimit: BigInt(15000000),
              maxFeePerGas: gasPrice,
              maxPriorityFeePerGas: gasPrice,
            }
          );
        },
        userAddress,
        provider
      );
      console.log("Transacción enviada, esperando confirmación...");
      const receipt = await tx.wait();
      console.log("✅ Inversión confirmada");
      console.log("🧾 Hash de la transacción:", tx.hash);
      console.log("📊 Detalles del recibo:", receipt);
    } catch (error: any) {
      console.error("❌ La transacción falló:", error);
      if (error.transaction) {
        console.error("Detalles de la transacción:", error.transaction);
      }
      if (error.receipt) {
        console.error("Detalles del recibo:", error.receipt);
      }
      return NextResponse.json(
        { error: "❌ La transacción falló", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "✅ Swap completed successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error processing swap:", error);
    return NextResponse.json({ error: "❌ Internal Server Error" }, { status: 500 });
  }
}
