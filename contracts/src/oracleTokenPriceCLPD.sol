// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@stability/contracts/src/strategies/libs/UniswapV3MathLib.sol";

/**
 * @dev Contract deployed on Base Mainnet
 * @notice You can view the deployed contract at:
 * https://basescan.org/address/0xFba35c65C3cfCA94d0d0d40F77F2A6eE0102EE4C
 * 
 * @dev Library deployed on Base Mainnet:
 * UniswapV3MathLib.sol
 * https://basescan.org/address/0xb98de2ea6e0aec813e3fe747d0fdbe65af71b456
 */

// Interface for interacting with Uniswap V3 Pool
interface IUniswapV3Pool {
    function slot0() external view returns (
        uint160 sqrtPriceX96,
        int24 tick,
        uint16 observationIndex,
        uint16 observationCardinality,
        uint16 observationCardinalityNext,
        uint8 feeProtocol,
        bool unlocked
    );

    function token0() external view returns (address);
    function token1() external view returns (address);
}

contract oracleTokenPriceCLPD {
    IUniswapV3Pool public uniswapV3Pool;

    // Address of the Uniswap V3 pool for CLPD/USDC
    address public POOL_ADDRESS;

    // Number of decimals for the tokens
    uint256 constant CLPD_DECIMALS = 18;
    uint256 constant USDC_DECIMALS = 6;

    // Variable to store the last calculated price
    uint256 public lastPrice;

    // Event to log when the pool address is set or updated
    event PoolAddressSet(address newPoolAddress);

    // Owner of the contract
    address public owner;

    // Constructor to set the owner
    constructor() {
        owner = msg.sender;
    }

    // Modifier to restrict access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Function to set or update the pool address, only callable by the owner
    function setPoolAddress(address _poolAddress) public onlyOwner {
        require(_poolAddress != address(0), "Invalid pool address");
        POOL_ADDRESS = _poolAddress;
        uniswapV3Pool = IUniswapV3Pool(POOL_ADDRESS);
        emit PoolAddressSet(_poolAddress);
    }

    // Function to get the price of a token
    function getPrice(address tokenIn, uint256 amount) public returns (uint) {
        address token0 = uniswapV3Pool.token0();
        address token1 = uniswapV3Pool.token1();

        // Determine the decimals for input and output tokens
        uint tokenInDecimals = tokenIn == token0 ? CLPD_DECIMALS : USDC_DECIMALS;
        uint tokenOutDecimals = tokenIn == token1 ? CLPD_DECIMALS : USDC_DECIMALS;

        // Get the current price from the pool
        (uint160 sqrtPriceX96,,,,,,) = uniswapV3Pool.slot0();

        // Calculate the price and store it in lastPrice
        lastPrice = UniswapV3MathLib.calcPriceOut(tokenIn, token0, sqrtPriceX96, tokenInDecimals, tokenOutDecimals, amount);
        
        return lastPrice;
    }
}
