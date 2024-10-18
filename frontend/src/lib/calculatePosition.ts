// import { CurrencyAmount, Token } from "@uniswap/sdk-core";
// import { Pool } from "@uniswap/v3-sdk";

// export function calculatePositionAmounts(
//   pool: Pool,
//   tickLower: number,
//   tickUpper: number,
//   liquidity: bigint
// ): { amount0: CurrencyAmount<Token>; amount1: CurrencyAmount<Token> } {
//   let amount0: CurrencyAmount<Token>;
//   let amount1: CurrencyAmount<Token>;

//   if (pool.tickCurrent < tickLower) {
//     amount0 = CurrencyAmount.fromRawAmount(
//       pool.token0,
//       pool.token0.amount0Delta(tickLower, tickUpper, liquidity, false)
//     );
//     amount1 = CurrencyAmount.fromRawAmount(pool.token1, "0");
//   } else if (pool.tickCurrent < tickUpper) {
//     amount0 = CurrencyAmount.fromRawAmount(
//       pool.token0,
//       pool.amount0Delta(tickLower, tickUpper, liquidity, false)
//     );
//     amount1 = CurrencyAmount.fromRawAmount(pool.token1, "0");
//   } else {
//     amount0 = CurrencyAmount.fromRawAmount(pool.token0, "0");
//     amount1 = CurrencyAmount.fromRawAmount(
//       pool.token1,
//       pool.token1.amount1Delta(tickLower, tickUpper, liquidity, false)
//     );
//   }

//   return { amount0, amount1 };
// }
