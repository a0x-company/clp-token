// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISwapRouter02} from "@uniswap/contracts/interfaces/ISwapRouter02.sol";

/**
 * @dev Contract deployed on Base Mainnet
 * @notice You can view the deployed contract at:
 * https://basescan.org/address/0x969291bEB92fAa156C2c77C3d364E7b40428D096
 */

contract SwapCLPD {
    
    ISwapRouter02 private immutable router;

    // Address of Uniswap V3 SwapRouter
    address private constant SWAP_ROUTER_ADDRESS = 0x2626664c2603336E57B271c5C0b26F421741e481;

    // Address of Uniswap V3 NonfungiblePositionManager
    address private constant POSITION_MANAGER_ADDRESS = 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1;

    // Default pool fee for swaps (0.3%)
    uint24 private constant poolFee = 3000;

    constructor() {
        router = ISwapRouter02(SWAP_ROUTER_ADDRESS);
    }

    // Event to track token swaps
    event TokensSwapped(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    // Event to track liquidity addition
    event LiquidityAdded(address indexed provider, uint256 tokenId, uint256 amount0, uint256 amount1);

    /**
     * @dev Function to swap tokens
     * @param tokenIn Address of the input token
     * @param tokenOut Address of the output token
     * @param amountIn Amount of input tokens to swap
     * @return amountOut The amount of output tokens received
     */
    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public returns (uint256 amountOut) {
        // Transfer `tokenIn` from the sender to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Approve `tokenIn` for the swap
        IERC20(tokenIn).approve(SWAP_ROUTER_ADDRESS, amountIn);

        // Prepare swap parameters
        ISwapRouter02.ExactInputSingleParams memory params = ISwapRouter02.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: poolFee,
            recipient: msg.sender,
            amountIn: amountIn,
            amountOutMinimum: 0, // No minimum output amount set (caution: this can lead to high slippage)
            sqrtPriceLimitX96: 0 // No price limit set
        });

        // Execute the swap
        amountOut = router.exactInputSingle(params);

        // Emit event for successful swap
        emit TokensSwapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

}