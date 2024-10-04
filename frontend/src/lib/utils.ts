import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    const millions = num / 1000000;
    return millions % 1 === 0 ? millions.toFixed(0) + "m" : millions.toFixed(1) + "m";
  } else if (num >= 1000) {
    const thousands = num / 1000;
    return (Math.floor(thousands * 10) / 10).toFixed(1) + "k";
  } else {
    return num.toString();
  }
};
