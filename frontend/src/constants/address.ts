export const addresses: {
  [key: string]: {
    swap: `0x${string}`;
    investment: `0x${string}`;
    CLPD: {
      address: `0x${string}`;
      decimals: number;
    };
    USDC: {
      address: `0x${string}`;
      decimals: number;
    };
    factoryAddress: `0x${string}`;
    poolUsdcClpdAddress: `0x${string}`;
    positionManageAddress: `0x${string}`;
  };
} = {
  base: {
    swap: "0x0000000000000000000000000000000000000000",
    investment: "0xCf26F8bcC82a9100279aDd043eA632A631CC10c8",
    poolUsdcClpdAddress: "0x778b848d35cdd7d20845237832a8dc47d6c28b65",
    positionManageAddress: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    factoryAddress: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    CLPD: {
      address: "0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1",
      decimals: 18,
    },
    USDC: {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
  },
  baseSepolia: {
    swap: "0x0000000000000000000000000000000000000000",
    investment: "0x0000000000000000000000000000000000000000",
    poolUsdcClpdAddress: "0x0000000000000000000000000000000000000000",
    positionManageAddress: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    factoryAddress: "0x0000000000000000000000000000000000000000",
    CLPD: {
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
    },
    USDC: {
      address: "0xcB0f68Cb1E6F4466F6970De9a3a70489Ee7D3a7A", // ERC20 Test
      decimals: 18,
    },
  },
};
