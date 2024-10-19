import { Contract } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";

// constants
import { addresses } from "@/constants/address";
import { CHAIN_SYMBOL } from "@/provider/WagmiConfig";
import { useEthersProvider } from "./useEthereumProvider";
import nonfungiblePositionManagerABI from "@/constants/nonfungiblePositionManager-abi.json";
import uniswapV3FactoryABI from "@/constants/uniswapV3Factory-abi.json";
import uniswapV3PoolABI from "@/constants/poolContract-abi.json";

export interface RawPosition {
  nonce: bigint;
  operator: string;
  token0: string;
  token1: string;
  fee: bigint;
  tickLower: bigint;
  tickUpper: bigint;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

interface RawPool {
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: bigint;
  feeGrowthGlobal0X128: bigint;
  feeGrowthGlobal1X128: bigint;
  feeGrowthOutsideLower0X128: bigint;
  feeGrowthOutsideLower1X128: bigint;
  feeGrowthOutsideUpper0X128: bigint;
  feeGrowthOutsideUpper1X128: bigint;
}

const usePositions = () => {
  const [loading, setLoading] = useState(true);
  const [nftTokenIds, setNftTokenIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const provider = useEthersProvider();
  const { address } = useAccount();
  const [rawPositions, setRawPositions] = useState<RawPosition[]>([]);
  const [rawPool, setRawPool] = useState<RawPool | null>(null);
  const [cache, setCache] = useState<string>("");

  const nftManagerContract = useMemo(
    () =>
      provider
        ? new Contract(
            addresses[CHAIN_SYMBOL].positionManageAddress,
            nonfungiblePositionManagerABI,
            provider
          )
        : undefined,
    [provider]
  );

  const factoryContract = useMemo(
    () =>
      provider
        ? new Contract(addresses[CHAIN_SYMBOL].factoryAddress, uniswapV3FactoryABI, provider)
        : undefined,
    [provider]
  );

  const getTokenIds = async (owner: string): Promise<bigint[]> => {
    try {
      if (!nftManagerContract) {
        throw new Error("Contrato NFT no inicializado");
      }
      const balance: bigint = await nftManagerContract.balanceOf(owner);
      const tokenIds: bigint[] = [];

      for (let index = 0; index < Number(balance); index++) {
        try {
          const result = await nftManagerContract.tokenOfOwnerByIndex(owner, index);
          tokenIds.push(BigInt(result));
          await delay(500);
        } catch (error) {
          console.error(`Error al obtener token en índice ${index}:`, error);
        }
      }

      console.log("IDs de tokens obtenidos:", tokenIds);
      return tokenIds;
    } catch (error) {
      console.error("Error en getTokenIds:", error);
      throw error; // Re-lanza el error para manejarlo en fetchPositions
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchRawPositions = async (tokenIds: bigint[]): Promise<any> => {
    console.log("tokenIds", tokenIds);
    const results = [];
    for (const tokenId of tokenIds) {
      try {
        if (!nftManagerContract) {
          throw new Error("Contrato NFT no inicializado");
        }
        const position = await nftManagerContract.positions(tokenId).catch((error: any) => {
          console.warn(`Error al obtener posición para el token ${tokenId}:`, error);
          return null;
        });

        if (!position) {
          continue;
        }

        results.push({
          nonce: position.nonce,
          operator: position.operator,
          token0: position.token0,
          token1: position.token1,
          fee: position.fee,
          tickLower: position.tickLower,
          tickUpper: position.tickUpper,
          liquidity: position.liquidity,
          feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
          feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
          tokensOwed0: position.tokensOwed0,
          tokensOwed1: position.tokensOwed1,
        });

        // Añadir un retraso de 500 milisegundos entre cada llamada
        await delay(500);
      } catch (error) {
        console.error(`Error inesperado al procesar el token ${tokenId}:`, error);
      }
    }
    return results.filter((result) => result !== null);
  };

  const fetchRawPool = async (
    positionTickLower: bigint,
    positionTickUpper: bigint
  ): Promise<RawPool> => {
    if (!factoryContract) {
      throw new Error("Contrato de fábrica no inicializado");
    }
    const poolContract = new Contract(
      addresses[CHAIN_SYMBOL].poolUsdcClpdAddress,
      uniswapV3PoolABI,
      provider
    );

    const fetchWithRetry = async (method: () => Promise<any>, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const result = await method();
          await delay(1500); // Aumentamos el delay a 1.5 segundos
          return result;
        } catch (error) {
          console.warn(`Error en intento ${i + 1}:`, error);
          if (i === retries - 1) throw error;
          await delay(2000); // Esperamos 2 segundos antes de reintentar
        }
      }
    };

    try {
      const [
        slot0,
        liquidity,
        feeGrowthGlobal0X128,
        feeGrowthGlobal1X128,
        tickLowerData,
        tickUpperData,
      ] = await Promise.all([
        fetchWithRetry(() => poolContract.slot0()),
        fetchWithRetry(() => poolContract.liquidity()),
        fetchWithRetry(() => poolContract.feeGrowthGlobal0X128()),
        fetchWithRetry(() => poolContract.feeGrowthGlobal1X128()),
        fetchWithRetry(() => poolContract.ticks(positionTickLower)),
        fetchWithRetry(() => poolContract.ticks(positionTickUpper)),
      ]);

      const {
        feeGrowthOutside0X128: feeGrowthOutsideLower0X128,
        feeGrowthOutside1X128: feeGrowthOutsideLower1X128,
      } = tickLowerData;

      const {
        feeGrowthOutside0X128: feeGrowthOutsideUpper0X128,
        feeGrowthOutside1X128: feeGrowthOutsideUpper1X128,
      } = tickUpperData;

      return {
        sqrtPriceX96: slot0.sqrtPriceX96,
        liquidity,
        tick: slot0.tick,
        feeGrowthGlobal0X128,
        feeGrowthGlobal1X128,
        feeGrowthOutsideLower0X128,
        feeGrowthOutsideLower1X128,
        feeGrowthOutsideUpper0X128,
        feeGrowthOutsideUpper1X128,
      };
    } catch (error) {
      console.error("Error en fetchRawPool:", error);
      throw new Error("No se pudo obtener la información del pool");
    }
  };

  const fetchPositions = useCallback(async () => {
    if (!address || !addresses[CHAIN_SYMBOL].positionManageAddress) return;
    const cacheKey = address + addresses[CHAIN_SYMBOL].positionManageAddress;
    if (cacheKey === cache) return;
    setCache(cacheKey);
    setLoading(true);
    setError(null);

    try {
      const tokenIds = await getTokenIds(address);
      console.log("IDs de tokens obtenidos:", tokenIds);
      setNftTokenIds(tokenIds.map((id) => Number(id)));

      if (tokenIds.length > 0) {
        const rawPositions: RawPosition[] = await fetchRawPositions(tokenIds);
        console.log("rawPositions", rawPositions);
        setRawPositions(rawPositions);

        if (rawPositions.length > 0) {
          await delay(1000);
          const rawPool: RawPool = await fetchRawPool(
            rawPositions[0].tickLower,
            rawPositions[0].tickUpper
          );
          console.log("rawPool", rawPool);
          setRawPool(rawPool);
        } else {
          setRawPool(null);
        }
      } else {
        setRawPositions([]);
        setRawPool(null);
      }
    } catch (err) {
      console.error("Error al obtener posiciones:", err);
      setError("No se pudieron obtener las posiciones. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [address, cache, addresses]);

  const fetchedPositions = useRef(false);

  useEffect(() => {
    if (!fetchedPositions.current) {
      fetchPositions();
      fetchedPositions.current = true;
    }
  }, [fetchPositions]);

  return { loading, error, refetch: fetchPositions, nftTokenIds, rawPositions, rawPool };
};

export default usePositions;
