// react
import { useEffect, useRef } from "react";

// abi
// import { SwapAbi } from "@/constants/abi/SwapAbi";

// wagmi
import { getAddress, zeroAddress } from "viem";
import {
  useAccount,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

export const useSwap = (
  _contractAddress: `0x${string}`,
  _amount: bigint,
  onSuccess?: () => void,
  refetch: boolean = false
) => {
  const { chainId } = useAccount();

  const contractAddress = getAddress(_contractAddress ? _contractAddress : zeroAddress);

  const simulate = useSimulateContract({
    address: contractAddress,
    chainId: chainId,
    // abi: SwapAbi,
    functionName: "buy",
    args: [_amount],
    query: {
      enabled: _amount > 0 && refetch,
    },
  });

  console.log(simulate);

  const write = useWriteContract();

  const wait = useWaitForTransactionReceipt({
    hash: write.data,
    query: {
      meta: {
        successMessage: `Successfully swapped`,
      },
    },
  });

  const onSuccessExecuted = useRef(false);
  const lastTransactionHash = useRef<`0x${string}` | undefined>(undefined);

  useEffect(() => {
    if (write.data && write.data !== lastTransactionHash.current) {
      lastTransactionHash.current = write.data;
      onSuccessExecuted.current = false;
    }
    if (wait.isSuccess && onSuccess && !onSuccessExecuted.current) {
      onSuccess();
      onSuccessExecuted.current = true;
    }
  }, [wait.isSuccess, onSuccess, write.data]);

  return {
    simulate,
    isLoading: write.isPending || wait.isLoading || (simulate.isPending && !simulate.isFetched),
    write,
    wait,
  };
};
