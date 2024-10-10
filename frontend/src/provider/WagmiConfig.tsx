import React from "react";
import { http } from "viem";
import { WagmiProvider, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";
import Web3AuthConnectorInstance from "./_Web3AuthConnectorInstance";

const isDevelopment = process.env.NODE_ENV === "development";
export const selectedChain = !isDevelopment ? base : base;
export const CHAIN_SYMBOL = !isDevelopment ? "base" : "eth";

export const { web3AuthConnector, web3AuthInstance } = Web3AuthConnectorInstance([selectedChain]);

const config = createConfig({
  connectors: [
    web3AuthConnector,
    // coinbaseWallet({ appName: "CLPD | Peso Chileno Digital", preference: "smartWalletOnly" }),
  ],
  chains: [selectedChain],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

type WagmiConfigProps = {
  children: React.ReactNode;
};

const WagmiConfig: React.FC<WagmiConfigProps> = ({ children }) => {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
};

export default WagmiConfig;
