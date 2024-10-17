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

export async function POST(request: Request) {
  console.info("[POST][/api/invest/usdc]");
  const {
    userAddress,
    investAmount,
    encryptedPKey,
    iv,
  }: { userAddress: `0x${string}`; investAmount: number; encryptedPKey: string; iv: string } =
    await request.json();

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

    // Check if user has enough USDC balance
    const provider = new ethers.JsonRpcProvider(base.rpcUrls.default.http[0]);
    const contractUSDC = new ethers.Contract(addresses.base.USDC.address, erc20Abi, provider);
    const contractCLPD = new ethers.Contract(addresses.base.CLPD.address, erc20Abi, provider);
    const balanceUSDC = await contractUSDC.balanceOf(userAddress);
    const balanceCLPD = await contractCLPD.balanceOf(userAddress);

    console.log("💰 Invest USDC amount:", investAmount);
    console.log("💰 User USDC balance:", formatUnits(balanceUSDC, 6));
    console.log("💰 User CLPD balance:", formatUnits(balanceCLPD, 6));

    if (investAmount > Number(formatUnits(balanceUSDC, 6))) {
      console.log("❌ Insufficient USDC balance");
      return NextResponse.json({ error: "❌ Insufficient USDC balance" }, { status: 400 });
    }

    const balanceETH = await provider.getBalance(userAddress);
    console.log("💰 ETH balance in user wallet:", formatEther(balanceETH));

    const MINIMUM_ETH_BALANCE = 0.000004 * 5;

    if (Number(formatEther(balanceETH)) < MINIMUM_ETH_BALANCE) {
      console.log("❌ Insufficient ETH balance in user wallet");

      const pkRechargeEthCldp = process.env.PK_RECHARGE_ETH_CLPD;

      if (!pkRechargeEthCldp) {
        console.log("❌ PK_RECHARGE_ETH_CLPD not found");
        return NextResponse.json({ error: "❌ PK_RECHARGE_ETH_CLPD not found" }, { status: 400 });
      }

      const walletRecharge = new ethers.Wallet(pkRechargeEthCldp, provider);

      const amountToSend = parseFloat((MINIMUM_ETH_BALANCE * 5).toFixed(6));

      const tx = {
        to: userAddress,
        value: parseEther(amountToSend.toString()),
      };

      try {
        const transactionResponse = await walletRecharge.sendTransaction(tx);

        console.log("✅ Charge ETH to user wallet completed successfully");
        console.log("🧾 Transaction hash:", transactionResponse.hash);
      } catch (error) {
        console.error("❌ Transaction failed:", error);
        return NextResponse.json({ error: "❌ Transaction failed" }, { status: 400 });
      }
    }

    const wallet = new ethers.Wallet(userPrivateKey, provider);

    const contractWithSignerUSDC: any = contractUSDC.connect(wallet);

    const amountWithDecimals = parseUnits(investAmount.toString(), addresses.base.USDC.decimals);

    const allowance = await checkAllowance(
      userAddress,
      addresses.base.USDC.address,
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
      console.log("💰 Approving USDC");
      try {
        const tx = await approve(
          addresses.base.investment,
          amountWithDecimals.toString(),
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

    /* Allowance CLPD */
    const contractWithSignerCLPD: any = contractCLPD.connect(wallet);

    const amountWithDecimalsCLPD = parseUnits(
      (investAmount * 1000).toString(), // TODO: getPrice from API, 1000 CLPD = 1 USDC
      addresses.base.CLPD.decimals
    );

    const allowanceCLPD = await checkAllowance(
      userAddress,
      addresses.base.CLPD.address,
      addresses.base.investment,
      provider
    );
    console.log("💰 Allowance CLPD:", allowanceCLPD);
    console.log("💰 Amount with decimals:", amountWithDecimalsCLPD);

    if (Number(allowanceCLPD) < amountWithDecimalsCLPD) {
      console.log("💰 Approving CLPD", contractWithSignerCLPD);
      try {
        const tx = await approve(
          addresses.base.investment,
          amountWithDecimalsCLPD.toString(),
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
      console.log("Iniciando inversión con USDC:", amountWithDecimals.toString());
      const tx = await contractInvestmentWithSigner.investUSDCwithoutCLPD(amountWithDecimals, {
        gasLimit: BigInt(15000000),
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice,
      });
      console.log("Transacción enviada, esperando confirmación...");
      const receipt = await tx.wait();
      console.log("✅ Inversión confirmada");
      console.log("🧾 Hash de la transacción:", tx.hash);
      console.log("📊 Detalles del recibo:", receipt);
    } catch (error: any) {
      console.error("❌ La transacción falló:", error);
      console.error("Mensaje de error:", error.message);
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
    console.error("❌ Error processing transfer:", error);
    return NextResponse.json({ error: "❌ Internal Server Error" }, { status: 500 });
  }
}
