// jose
import * as jose from "jose";

// eccrypto
import { getPublicCompressed } from "@toruslabs/eccrypto";

// constants
import CLPD_ABI from "@/constants/CLPD-abi.json";
import { addresses } from "@/constants/address";

// next
import { NextResponse } from "next/server";

// crypto
import crypto from "crypto";
import { ethers, parseEther, parseUnits } from "ethers";

// viem
import { base } from "viem/chains";
import { formatEther } from "viem";

export async function POST(request: Request) {
  const { userAddress, address, withdrawAmount, encryptedPKey, iv } = await request.json();

  const idToken = request.headers.get("Authorization")?.split(" ")[1];
  const encryptionKey = request.headers.get("X-Encryption-Key") as string;

  if (!userAddress || !address || !idToken || !encryptedPKey) {
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
    const contract = new ethers.Contract(addresses.base.CLPD.address, CLPD_ABI, provider);
    const balance = await contract.balanceOf(userAddress);

    console.log("💰 Withdraw CLPD amount:", withdrawAmount);
    console.log("💰 User CLPD balance:", formatEther(balance));

    if (withdrawAmount > Number(formatEther(balance))) {
      console.log("❌ Insufficient CLPD balance");
      return NextResponse.json({ error: "❌ Insufficient CLPD balance" }, { status: 400 });
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

      const amountToSend = parseFloat((MINIMUM_ETH_BALANCE * 5).toFixed(18));

      const tx = {
        to: userAddress,
        value: parseEther(amountToSend.toString()),
      };

      try {
        const transactionResponse = await walletRecharge.sendTransaction(tx);
        await transactionResponse.wait();

        console.log("✅ Charge ETH to user wallet completed successfully");
        console.log("🧾 Transaction hash:", transactionResponse.hash);
      } catch (error) {
        console.error("❌ Transaction failed:", error);
        return NextResponse.json({ error: "❌ Transaction failed" }, { status: 400 });
      }
    }

    const wallet = new ethers.Wallet(userPrivateKey, provider);

    const contractWithSigner: any = contract.connect(wallet);

    const amountWithDecimals = parseUnits(withdrawAmount.toString(), addresses.base.CLPD.decimals);

    try {
      const tx = await contractWithSigner.transfer(address, amountWithDecimals);
      console.log("🧾 Transaction sent, waiting confirmation...");
      console.log("🧾 Transaction hash:", tx.hash);
      await tx.wait();

      console.log("✅ Transfer confirmed");
    } catch (error) {
      console.error("❌ Transaction failed:", error);
      return NextResponse.json({ error: "❌ Transaction failed" }, { status: 400 });
    }

    // TODO: guardar en la base de datos que se realizó la transferencia

    return NextResponse.json({ message: "✅ Transfer completed successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error processing transfer:", error);
    return NextResponse.json({ error: "❌ Internal Server Error" }, { status: 500 });
  }
}
