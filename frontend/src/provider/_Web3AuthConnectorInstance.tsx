// Web3Auth Libraries
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK, UX_MODE } from "@web3auth/base";
import { Chain } from "wagmi/chains";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";

export const web3AuthNetwork =
  process.env.NODE_ENV === "development"
    ? WEB3AUTH_NETWORK.TESTNET
    : WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
export const clientId =
  process.env.NODE_ENV === "development"
    ? "BPqYQP85hVS7ya9Fb_CLkrIInUtQz9qboZKXGPydYKukgfmQo1hcGYZD-JpxFyjqwFDl4P93-j8nuZNv1Zaf9Bg"
    : (process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID as string);

export default function Web3AuthConnectorInstance(chains: Chain[]) {
  // Create Web3Auth Instance
  const name = "CLPD Token";
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x" + chains[0].id.toString(16),
    rpcTarget: chains[0].rpcUrls.default.http[0], // This is the public RPC we have added, please pass on your own endpoint while creating an app
    displayName: chains[0].name,
    tickerName: chains[0].nativeCurrency?.name,
    ticker: chains[0].nativeCurrency?.symbol,
    blockExplorerUrl: chains[0].blockExplorers?.default.url[0] as string,
  };

  const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
  });

  const web3AuthInstance = new Web3AuthNoModal({
    clientId: clientId,
    chainConfig,
    privateKeyProvider,
    uiConfig: {
      appName: name,
      defaultLanguage: "en",
      logoLight: "https://web3auth.io/images/web3authlog.png",
      logoDark: "https://web3auth.io/images/web3authlogodark.png",
      mode: "dark",
    },
    web3AuthNetwork: web3AuthNetwork,
    enableLogging: true,
  });

  const openloginAdapter = new OpenloginAdapter({
    adapterSettings: {
      uxMode: UX_MODE.REDIRECT,
    },
  });

  web3AuthInstance.configureAdapter(openloginAdapter);

  return {
    web3AuthInstance,
    web3AuthConnector: Web3AuthConnector({
      web3AuthInstance,
      loginParams: {
        loginProvider: "google",
      },
    }),
  };
}
