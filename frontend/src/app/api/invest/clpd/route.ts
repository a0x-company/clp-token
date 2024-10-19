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
      MINIMUM_ETH_BALANCE *= 1.4; // Aumenta en un 20%
      console.log("Nuevo MINIMUM_ETH_BALANCE:", MINIMUM_ETH_BALANCE);

      await checkAndRechargeEthBalance(userAddress, provider);
      return await transactionFunction();
    }
    throw error;
  }
}

export async function POST(request: Request) {
  console.info(`[POST][/api/invest/usdc]`);
  const {
    userAddress,
    investAmount,
    encryptedPKey,
    iv,
  }: {
    userAddress: `0x${string}`;
    investAmount: number;
    encryptedPKey: string;
    iv: string;
  } = await request.json();

  const idToken = request.headers.get("Authorization")?.split(" ")[1];
  const encryptionKey = request.headers.get("X-Encryption-Key") as string;

  if (!userAddress || !idToken || !encryptedPKey) {
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

    // Check if user has enough CLPD balance
    const provider = new ethers.JsonRpcProvider(base.rpcUrls.default.http[0]);
    const contractCLPD = new ethers.Contract(addresses.base.CLPD.address, erc20Abi, provider);
    const contractUSDC = new ethers.Contract(addresses.base.USDC.address, erc20Abi, provider);
    const balanceCLPD = await contractCLPD.balanceOf(userAddress);

    const balanceCLPDformatted = formatUnits(balanceCLPD, addresses.base.CLPD.decimals);

    console.log("💰 Invest CLPD amount:", investAmount);
    console.log("💰 User CLPD balance:", balanceCLPDformatted);

    if (investAmount > Number(balanceCLPDformatted)) {
      console.log("❌ Insufficient CLPD balance");
      return NextResponse.json({ error: "❌ Insufficient CLPD balance" }, { status: 400 });
    }

    const balanceETH = await provider.getBalance(userAddress);
    console.log("💰 ETH balance in user wallet:", formatEther(balanceETH));

    await checkAndRechargeEthBalance(userAddress, provider);

    const wallet = new ethers.Wallet(userPrivateKey, provider);

    const contractWithSignerCLPD: any = contractCLPD.connect(wallet);

    const amountWithDecimals = parseUnits(investAmount.toString(), addresses.base.CLPD.decimals);
    const amountApproveCLPD = parseUnits("100000000000", addresses.base.CLPD.decimals);

    const allowance = await checkAllowance(
      userAddress,
      addresses.base.CLPD.address,
      addresses.base.investment,
      provider
    );

    console.log("💰 Allowance:", allowance);
    console.log(
      "💰 Amount with decimals:",
      amountWithDecimals,
      Number(allowance) < amountWithDecimals
    );

    if (Number(allowance) < amountWithDecimals) {
      console.log("💰 Approving CLPD");
      try {
        const tx = await approve(
          addresses.base.investment,
          amountApproveCLPD.toString(),
          contractWithSignerCLPD
        );
        await tx.wait();

        console.log("✅ Approve confirmed");
        console.log("🧾 Transaction hash:", tx.hash);
      } catch (error) {
        console.error("❌ Transaction failed:", error);
        return NextResponse.json({ error: "❌ Transaction failed" }, { status: 400 });
      }
    }

    /* Allowance USDC */
    const contractWithSignerUSDC: any = contractUSDC.connect(wallet);

    const amountWithDecimalsUSDC = parseUnits(
      (investAmount / 1000).toString(), // TODO: getPrice from API, 1000 CLPD = 1 USDC
      addresses.base.USDC.decimals
    );
    const amountApproveUSDC = parseUnits("100000000000", addresses.base.USDC.decimals);

    const allowanceUSDC = await checkAllowance(
      userAddress,
      addresses.base.USDC.address,
      addresses.base.investment,
      provider
    );
    console.log("💰 Allowance USDC:", allowanceUSDC);
    console.log("💰 Amount with decimals:", amountWithDecimalsUSDC);

    if (Number(allowanceUSDC) < amountWithDecimalsUSDC) {
      console.log("💰 Approving USDC", contractWithSignerUSDC);
      try {
        const tx = await approve(
          addresses.base.investment,
          amountApproveUSDC.toString(),
          contractWithSignerUSDC
        );
        await tx.wait();
        console.log("✅ Approve confirmed");
        console.log("🧾 Transaction hash:", tx.hash);
      } catch (error) {
        console.error("❌ Transaction failed:", error);
        return NextResponse.json({ error: "❌ Transaction failed" }, { status: 400 });
      }
    }

    /* Contract investment */
    const contractInvestment = new ethers.Contract(
      addresses.base.investment,
      investmentAbi,
      wallet
    );

    const contractInvestmentWithSigner = contractInvestment.connect(wallet) as any;

    const gasPrice = await getGasPriceBaseViem();

    console.log("💰 Gas price:", gasPrice);

    try {
      console.log("Iniciando inversión con CLPD:", investAmount);
      const tx = await handleTransaction(
        async () => {
          return await contractInvestmentWithSigner.investCLPDwithoutUSDC(amountWithDecimals, {
            gasLimit: BigInt(15000000),
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice,
          });
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
      console.error("Mensaje de error:", error.message);
      if (error.transaction) {
        console.log("Detalles de la transacción:", error.transaction);
      }
      if (error.receipt) {
        console.log("Detalles del recibo:", error.receipt);
      }

      // Intentar recargar ETH y reintentar la transacción si falla por fondos insuficientes
      if (error.code === "INSUFFICIENT_FUNDS") {
        console.log("Intentando recargar ETH y reintentar la transacción...");
        await checkAndRechargeEthBalance(userAddress, provider);

        // Reintentar la transacción
        const retryTx = await contractInvestmentWithSigner.investCLPDwithoutUSDC(
          amountWithDecimals,
          {
            gasLimit: BigInt(10000000),
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice,
          }
        );
        const retryReceipt = await retryTx.wait();
        console.log("✅ Inversión confirmada después del reintento");
        console.log("🧾 Hash de la transacción:", retryTx.hash);
        console.log("📊 Detalles del recibo:", retryReceipt);
      } else {
        throw error;
      }
    }

    // try {
    //   const tx = await contractWithSigner.approve(addresses.base.USDC.address, amountWithDecimals);
    //   await tx.wait();

    //   console.log("✅ Transfer confirmed");
    //   console.log("🧾 Transaction hash:", tx.hash);
    // } catch (error) {
    //   console.error("❌ Transaction failed:", error);
    //   return NextResponse.json({ error: "❌ Transaction failed" }, { status: 400 });
    // }

    // TODO: guardar en la base de datos que se realizó la transferencia

    return NextResponse.json({ message: "✅ Transfer completed successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error al procesar la transferencia:", error);
    return NextResponse.json({ error: "❌ Error Interno del Servidor" }, { status: 500 });
  }
}
