// react
import { useState, useEffect } from "react";

// web3auth
import { useWeb3Auth } from "@web3auth/no-modal-react-hooks";
import { WALLET_ADAPTERS } from "@web3auth/base";

// wagmi
import { useAccount } from "wagmi";

// next
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// axios
import axios from "axios";

// global store
import { useUserStore } from "@/context/global-store";

// crypto
import crypto from "crypto";

export const useGoogleConnect = () => {
  const { address } = useAccount();
  const { setUser } = useUserStore();
  const { connectTo, isConnected, userInfo, init, isInitialized, provider } =
    useWeb3Auth();
  const [loadingUser, setLoadingUser] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initialize = async () => {
      await init();
    };
    if (!isInitialized) {
      initialize();
    }
  }, [init, isInitialized]);

  useEffect(() => {
    const checkUserInfo = async () => {
      setLoadingUser(true);
      if (isConnected && isInitialized && provider) {
        const idToken = userInfo?.idToken;
        const publicKey = await provider?.request({
          method: "eth_private_key",
        });

        const encryptionKey = crypto.randomBytes(32).toString("hex");
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
          "aes-256-cbc",
          Buffer.from(encryptionKey, "hex"),
          iv
        );

        let encryptedPKey = cipher.update(publicKey as string, "utf8", "hex");

        encryptedPKey += cipher.final("hex");

        const ivHex = iv.toString("hex");

        try {
          const response = await axios.post(
            `/api/user`,
            { encryptedPKey, address, iv: ivHex },
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
                "X-Encryption-Key": encryptionKey,
              },
            }
          );
          setUser(response.data);
          if (response.data) {
            localStorage.setItem("rwa_email", response.data.email);
            if (pathname.includes("onboarding")) {
              const redirectPath = `/onboarding?kyc=true&email=${response.data.email}`;
              router.push(redirectPath);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoadingUser(false);
    };

    checkUserInfo();
  }, [
    isConnected,
    address,
    setUser,
    userInfo,
    router,
    isInitialized,
    provider,
    pathname,
  ]);

  const handleConnect = async () => {
    await connectTo(WALLET_ADAPTERS.OPENLOGIN, { loginProvider: "google" });
  };

  return { isConnected, loadingUser, handleConnect };
};
