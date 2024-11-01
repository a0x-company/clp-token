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

export const useCLPDBalance = ({
  address,
  chainId,
}: {
  address: `0x${string}` | undefined;
  chainId?: number;
}) => {
  const chainName = selectedChain.name.toLowerCase();

  /* CLPD Balance */
  const clpdBalance = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: addresses[chainName].CLPD.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? zeroAddress],
        chainId: chainId ?? selectedChain.id,
      },
      {
        address: addresses[chainName].CLPD.address,
        abi: erc20Abi,
        functionName: "decimals",
        chainId: chainId ?? selectedChain.id,
      },
    ],
  });

  const clpdBalanceFormatted = useMemo(() => {
    if (!clpdBalance.data) return "0";
    return Number(formatUnits(clpdBalance.data?.[0]!, 18) || 0).toFixed(2);
  }, [clpdBalance.data]);

  return { clpdBalanceFormatted, refetch: clpdBalance.refetch };
};
