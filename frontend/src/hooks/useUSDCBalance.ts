// react
import { useMemo } from "react";
// viem
import { erc20Abi, formatUnits, zeroAddress } from "viem";
// wagmi
import { useReadContracts } from "wagmi";
// constants
import { addresses } from "@/constants/address";
// provider
import { selectedChain } from "@/provider/WagmiConfig";

export const useUSDCBalance = ({ address }: { address: `0x${string}` | undefined }) => {
  const chainName = selectedChain.name.toLowerCase();

  /* USDC Balance */
  const usdcBalance = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: addresses[chainName].USDC.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? zeroAddress],
      },
      {
        address: addresses[chainName].USDC.address,
        abi: erc20Abi,
        functionName: "decimals",
      },
    ],
  });

  const usdcBalanceFormatted = useMemo(() => {
    if (!usdcBalance.data) return "0";
    return Number(formatUnits(usdcBalance.data?.[0]!, 18) || 0).toFixed(2);
  }, [usdcBalance.data]);

  return { usdcBalanceFormatted };
};
