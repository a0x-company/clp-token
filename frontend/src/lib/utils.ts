import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    const millions = num / 1000000;
    return millions % 1 === 0 ? millions.toFixed(0) + "m" : millions.toFixed(1) + "m";
  } else if (num >= 100000) {
    const hundreds = num / 1000;
    return hundreds.toFixed(0) + "k";
  } else {
    return num.toLocaleString();
  }
};

export function calculateFees(
  feeGrowthGlobal: bigint,
  feeGrowthOutsideLower: bigint,
  feeGrowthOutsideUpper: bigint,
  feeGrowthInsideLast: bigint,
  liquidity: bigint
): bigint {
  const Q128 = BigInt("340282366920938463463374607431768211455");

  // Calculate feeGrowthInside
  const feeGrowthBelow = feeGrowthOutsideLower;
  const feeGrowthAbove = feeGrowthOutsideUpper;
  const feeGrowthInside = feeGrowthGlobal - feeGrowthBelow - feeGrowthAbove;

  // Calculate fees
  const fees = (liquidity * (feeGrowthInside - feeGrowthInsideLast)) / Q128;

  return fees;
}
