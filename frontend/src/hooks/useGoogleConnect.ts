// react
import { useEffect, useState } from "react";

// web3auth
import { web3AuthInstance } from "@/provider/WagmiConfig";
import { WALLET_ADAPTERS } from "@web3auth/base";

// wagmi
import { useAccount, Connector, useConnect, useDisconnect } from "wagmi";

// next
import { usePathname, useRouter } from "next/navigation";

// axios
import axios from "axios";

// global store
import { useUserStore } from "@/context/global-store";

// crypto
import crypto from "crypto";

export const useGoogleConnect = () => {
  const { address } = useAccount();
  const { setUser } = useUserStore();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const [loadingUser, setLoadingUser] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const currentLang = pathname.startsWith("/es") ? "es" : "en";

  useEffect(() => {
    const checkUserInfo = async () => {
      setLoadingUser(true);
      if (web3AuthInstance.connected) {
        const userInfo = await web3AuthInstance.getUserInfo();
        const idToken = userInfo?.idToken;
        const publicKey = await web3AuthInstance.provider?.request({
          method: "eth_private_key",
        });

        const encryptionKey = crypto.randomBytes(32).toString("hex");
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(encryptionKey, "hex"), iv);

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
          if (response.status === 200) {
            console.log("response", response.data.user);
            setUser(response.data.user);
            localStorage.setItem("clpd_email", response.data.user.email);
            if (pathname.includes("onboarding")) {
              const redirectPath = `/onboarding?kyc=true&email=${response.data.email}`;
              router.push(redirectPath);
            }
          } else {
            console.log("response", response);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoadingUser(false);
    };

    checkUserInfo();
  }, [address, setUser, router, pathname, web3AuthInstance.connected]);

  const handleConnect = async () => {
    // await web3AuthInstance.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
    //   loginProvider: "google",
    // });
    console.log("connectors", connectors);
    const connector = connectors[0];
    try {
      connect({ connector });
    } catch (err) {
      console.error("Error connecting to Google:", err);
    }
  };

  const handleDisconnect = async () => {
    await web3AuthInstance.logout();
    disconnect();
    localStorage.removeItem("clpd_email");
    await axios.post("/api/user/logout");
    router.push("/");
  };

  return {
    isConnected: web3AuthInstance.connected,
    loadingUser,
    handleConnect,
    handleDisconnect,
  };
};
