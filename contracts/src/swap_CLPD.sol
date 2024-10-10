// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISwapRouter02} from "@uniswap/contracts/interfaces/ISwapRouter02.sol";

contract GenericTokenSwap {
    // Interface for interacting with Uniswap V3 SwapRouter
    ISwapRouter02 private immutable router;

    // Address of the Uniswap V3 SwapRouter on the network
    address private constant SWAP_ROUTER_ADDRESS = 0x2626664c2603336E57B271c5C0b26F421741e481;

    // Default pool fee for swaps (0.3%)
    uint24 private constant poolFee = 3000;

    /**
     * @dev Constructor initializes the router interface
     */
    constructor() {
        router = ISwapRouter02(SWAP_ROUTER_ADDRESS);
    }

    /**
     * @dev Function to swap tokens
     * @param tokenIn Address of the input token
     * @param tokenOut Address of the output token
     * @param amountIn Amount of input tokens to swap
     * @param amountOutMin Minimum amount of output tokens expected
     * @return amountOut The amount of output tokens received
     */
    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) external returns (uint256 amountOut) {
        // Transfer `tokenIn` tokens from the sender to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Approve `tokenIn` tokens for the swap
        IERC20(tokenIn).approve(SWAP_ROUTER_ADDRESS, amountIn);

        // Perform the swap from `tokenIn` to `tokenOut`
        ISwapRouter02.ExactInputSingleParams memory params = ISwapRouter02.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: poolFee,
            recipient: msg.sender,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        // Execute the swap
        amountOut = router.exactInputSingle(params);
    }
}
