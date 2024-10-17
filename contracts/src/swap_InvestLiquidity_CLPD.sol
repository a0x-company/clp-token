// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISwapRouter02} from "@uniswap/contracts/interfaces/ISwapRouter02.sol";
import "./oracleTokenPriceCLPD.sol";

/**
 * @dev Contract deployed on Base Mainnet
 * @notice You can view the deployed contract at:
 * https://basescan.org/address/0xCf26F8bcC82a9100279aDd043eA632A631CC10c8
*/

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract investCLPD is IERC721Receiver, Ownable {
    address public CLPD;
    address public USDC;

    ISwapRouter02 private immutable router;

    // Address of Uniswap V3 SwapRouter
    address public constant SWAP_ROUTER_ADDRESS = 0x2626664c2603336E57B271c5C0b26F421741e481;

    // Default pool fee for swaps (0.3%)
    uint24 private constant poolFee = 3000;

    IERC20 public clpd;
    IERC20 public usdc;

    int24 private constant MIN_TICK = -887272;
    int24 private constant MAX_TICK = -MIN_TICK;
    int24 private constant TICK_SPACING = 60;

    INonfungiblePositionManager public nonfungiblePositionManager =
        INonfungiblePositionManager(0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1);

    // Instance of the TokenPrice contract
    oracleTokenPriceCLPD public tokenPrice;

    // Events
    event TokensSwapped(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event LiquidityAddedWithUSDC(address indexed user, uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    event LiquidityAddedWithCLPD(address indexed user, uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    event InvestmentWithUSDC(address indexed user, uint256 amountUSDC, uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    event InvestmentWithCLPD(address indexed user, uint256 amountCLPD, uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    event FeesCollected(address indexed user, uint256 tokenId, uint256 amount0, uint256 amount1);
    event LiquidityIncreased(address indexed user, uint256 tokenId, uint256 amount0Added, uint256 amount1Added);
    event LiquidityDecreased(address indexed user, uint256 tokenId, uint256 percentage, uint256 amount0, uint256 amount1);

    constructor() Ownable(msg.sender) {
        router = ISwapRouter02(SWAP_ROUTER_ADDRESS);
    }

    // Function to set token addresses, can only be called by the owner
    function setTokenAddresses(address _CLPD, address _USDC) external onlyOwner {
        require(CLPD == address(0) && USDC == address(0), "Addresses already set");
        CLPD = _CLPD;
        USDC = _USDC;
        clpd = IERC20(CLPD);
        usdc = IERC20(USDC);
    }

    // Function to set the oracle token price address, can only be called by the owner
    function setOracleTokenPrice(address _tokenPriceAddress) external onlyOwner {
        require(address(tokenPrice) == address(0), "Oracle already set");
        tokenPrice = oracleTokenPriceCLPD(_tokenPriceAddress);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // Function to swap tokens
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

        emit TokensSwapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    // Function to invest with USDC
    function investWithUSDC(uint256 amount1ToAdd)
        public
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        uint256 price = tokenPrice.getPrice(CLPD, 0);

        require(price != 0, "Price must not be zero");

        // Calculate the amount of CLPD to add based on the price
        uint256 amount0ToAdd = (amount1ToAdd * (10 ** 18)) / price;

        // Transfer tokens from the user to the contract
        clpd.transferFrom(msg.sender, address(this), amount0ToAdd);
        usdc.transferFrom(msg.sender, address(this), amount1ToAdd);

        // Approve the position manager to use the tokens
        clpd.approve(address(nonfungiblePositionManager), amount0ToAdd);
        usdc.approve(address(nonfungiblePositionManager), amount1ToAdd);

        // Create the MintParams struct
        INonfungiblePositionManager.MintParams memory params =
            INonfungiblePositionManager.MintParams({
                token0: CLPD,
                token1: USDC,
                fee: 3000, // Represents the 0.3% fee tier in Uniswap V3.
                tickLower: (MIN_TICK / TICK_SPACING) * TICK_SPACING,
                tickUpper: (MAX_TICK / TICK_SPACING) * TICK_SPACING,
                amount0Desired: amount0ToAdd,
                amount1Desired: amount1ToAdd,
                amount0Min: 0,
                amount1Min: 0,
                recipient: msg.sender,
                deadline: block.timestamp
            });

        (tokenId, liquidity, amount0, amount1) =
            nonfungiblePositionManager.mint(params);

        emit LiquidityAddedWithUSDC(msg.sender, tokenId, liquidity, amount0, amount1);

        // Refund any leftover tokens to the user if not fully utilized in the liquidity provision.
        if (amount0 < amount0ToAdd) {
            clpd.approve(address(nonfungiblePositionManager), 0);
            uint256 refund0 = amount0ToAdd - amount0;
            clpd.transfer(msg.sender, refund0);
        }
        if (amount1 < amount1ToAdd) {
            usdc.approve(address(nonfungiblePositionManager), 0);
            uint256 refund1 = amount1ToAdd - amount1;
            usdc.transfer(msg.sender, refund1);
        }
    }

    // Function to invest with CLPD
    function investWithCLPD(uint256 amount0ToAdd)
        public
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        uint256 price = tokenPrice.getPrice(USDC, 0);

        require(price != 0, "Price must not be zero");

        // Calculate the amount of USDC to add based on the price
        uint256 amount1ToAdd = (amount0ToAdd * (10 ** 6)) / price;

        // Transfer tokens from the user to the contract
        clpd.transferFrom(msg.sender, address(this), amount0ToAdd);
        usdc.transferFrom(msg.sender, address(this), amount1ToAdd);

        // Approve the position manager to use the tokens
        clpd.approve(address(nonfungiblePositionManager), amount0ToAdd);
        usdc.approve(address(nonfungiblePositionManager), amount1ToAdd);

        // Create the MintParams struct
        INonfungiblePositionManager.MintParams memory params =
            INonfungiblePositionManager.MintParams({
                token0: CLPD,
                token1: USDC,
                fee: 3000, // Represents the 0.3% fee tier in Uniswap V3.
                tickLower: (MIN_TICK / TICK_SPACING) * TICK_SPACING,
                tickUpper: (MAX_TICK / TICK_SPACING) * TICK_SPACING,
                amount0Desired: amount0ToAdd,
                amount1Desired: amount1ToAdd,
                amount0Min: 0,
                amount1Min: 0,
                recipient: msg.sender,
                deadline: block.timestamp
            });

        (tokenId, liquidity, amount0, amount1) =
            nonfungiblePositionManager.mint(params);

        emit LiquidityAddedWithCLPD(msg.sender, tokenId, liquidity, amount0, amount1);

        // Refund any leftover tokens to the user if not fully utilized in the liquidity provision.
        if (amount0 < amount0ToAdd) {
            clpd.approve(address(nonfungiblePositionManager), 0);
            uint256 refund0 = amount0ToAdd - amount0;
            clpd.transfer(msg.sender, refund0);
        }
        if (amount1 < amount1ToAdd) {
            usdc.approve(address(nonfungiblePositionManager), 0);
            uint256 refund1 = amount1ToAdd - amount1;
            usdc.transfer(msg.sender, refund1);
        }
    }

    // Function to invest USDC without CLPD
    function investUSDCwithoutCLPD(uint256 amountUSDC)
        public
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        // Calculate half of the amount to swap
        uint256 halfAmount = (amountUSDC / 2) * 99 / 100;

        // Swap half of the USDC to CLPD
        uint256 amount0ToAdd = swapTokens(USDC, CLPD, halfAmount);

        // Call the investment function
        (tokenId, liquidity, amount0, amount1) = investWithCLPD(amount0ToAdd);

        // Emit event for investment with USDC
        emit InvestmentWithUSDC(msg.sender, amountUSDC, tokenId, liquidity, amount0, amount1);
    }

    // Function to invest CLPD without USDC
    function investCLPDwithoutUSDC(uint256 amountCLPD)
        public
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        // Calculate half of the amount to swap
        uint256 halfAmount = (amountCLPD / 2) * 99 / 100;

        // Swap half of the CLPD to USDC
        uint256 amount1ToAdd = swapTokens(CLPD, USDC, halfAmount);

        // Call the investment function
        (tokenId, liquidity, amount0, amount1) = investWithUSDC(amount1ToAdd);

        // Emit event for investment with CLPD
        emit InvestmentWithCLPD(msg.sender, amountCLPD, tokenId, liquidity, amount0, amount1);
    }

    // Function to collect all fees for a given position
    function collectAllFees(uint256 tokenId)
        external
        returns (uint256 amount0, uint256 amount1)
    {
        INonfungiblePositionManager.CollectParams memory params =
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });

        (amount0, amount1) = nonfungiblePositionManager.collect(params);

        // Emit event for fees collected
        emit FeesCollected(msg.sender, tokenId, amount0, amount1);
    }

    // Function to increase liquidity in the current range
    function increaseLiquidityCurrentRange(
        uint256 tokenId,
        uint256 amount0ToAdd,
        uint256 amount1ToAdd
    ) external returns (uint128 liquidity, uint256 amount0, uint256 amount1) {
        clpd.transferFrom(msg.sender, address(this), amount0ToAdd);
        usdc.transferFrom(msg.sender, address(this), amount1ToAdd);

        clpd.approve(address(nonfungiblePositionManager), amount0ToAdd);
        usdc.approve(address(nonfungiblePositionManager), amount1ToAdd);

        INonfungiblePositionManager.IncreaseLiquidityParams memory params =
            INonfungiblePositionManager.IncreaseLiquidityParams({
                tokenId: tokenId,
                amount0Desired: amount0ToAdd,
                amount1Desired: amount1ToAdd,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            });

        (liquidity, amount0, amount1) =
            nonfungiblePositionManager.increaseLiquidity(params);

        // Emit event for liquidity increased
        emit LiquidityIncreased(msg.sender, tokenId, amount0, amount1);
    }

    // Function to decrease liquidity by a percentage
    function decreaseLiquidityPercentage(uint256 tokenId, uint256 percentage) external {
        // Ensure the percentage is in the correct range (0-100)
        require(percentage <= 100, "Percentage must be between 0 and 100");

        // Get the current position
        INonfungiblePositionManager.Position memory position = nonfungiblePositionManager.positions(tokenId);
        
        // Access the current liquidity
        uint128 currentLiquidity = position.liquidity;

        // Ensure the position has liquidity
        require(currentLiquidity > 0, "No liquidity to withdraw");

        // Calculate the amount of liquidity to withdraw
        uint128 liquidityToDecrease = uint128((uint256(currentLiquidity) * percentage) / 100);

        // Call decreaseLiquidity with the calculated amount
        INonfungiblePositionManager.DecreaseLiquidityParams memory params =
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: liquidityToDecrease,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            });

        // Perform the liquidity decrease
        (uint256 amount0, uint256 amount1) = nonfungiblePositionManager.decreaseLiquidity(params);
        
        // Handle the returned tokens (CLPD and USDC)
        // Transfer the tokens back to the user
        if (amount0 > 0) {
            clpd.transfer(msg.sender, amount0);
        }
        if (amount1 > 0) {
            usdc.transfer(msg.sender, amount1);
        }

        // Emit the liquidity decreased event
        emit LiquidityDecreased(msg.sender, tokenId, percentage, amount0, amount1);
    }

}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    struct Position {
        uint96 nonce;
        address operator;
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
        uint256 feeGrowthInside0LastX128;
        uint256 feeGrowthInside1LastX128;
        uint256 tokensOwed0;
        uint256 tokensOwed1;
    }

    function positions(uint256 tokenId) external view returns (Position memory);

    function mint(MintParams calldata params)
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function collect(CollectParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);
    
    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    function increaseLiquidity(IncreaseLiquidityParams calldata params)
        external
        payable
        returns (uint128 liquidity, uint256 amount0, uint256 amount1);

    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    function decreaseLiquidity(DecreaseLiquidityParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);
}