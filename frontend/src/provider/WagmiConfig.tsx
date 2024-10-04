import React from "react";
import { http } from "viem";
import { WagmiProvider, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import Web3AuthConnectorInstance from "./_Web3AuthConnectorInstance";

const isDevelopment = process.env.NODE_ENV === "development";
export const selectedChain = !isDevelopment ? base : baseSepolia;
export const CHAIN_SYMBOL = !isDevelopment ? "base" : "eth";

export const { web3AuthConnector, web3AuthInstance } = Web3AuthConnectorInstance([selectedChain]);

const config = createConfig({
  connectors: [web3AuthConnector],
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
