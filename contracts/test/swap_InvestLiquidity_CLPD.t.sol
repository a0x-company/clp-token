// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {investCLPD} from "../src/swap_InvestLiquidity_CLPD.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * To run this contract, copy and paste this command in the terminal:
 * forge test -vvvv --match-path test/swap_InvestLiquidity_CLPD.t.sol --fork-url https://mainnet.base.org
 * 
 * @dev Contract deployed on Base Mainnet
 * https://basescan.org/address/0xCf26F8bcC82a9100279aDd043eA632A631CC10c8
 */

contract investCLPDTest is Test {

    investCLPD public investclpd;
    address public user = 0xd806A01E295386ef7a7Cea0B9DA037B242622743;    
    address public USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public CLPD = 0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1;

    function setUp() public {
        investclpd = investCLPD(0xCf26F8bcC82a9100279aDd043eA632A631CC10c8);
    }

    // ---------------------------------------------- Swap tests ----------------------------------------------
    function testSwap() public {
        // User approves the swap contract to spend their USDC
        vm.prank(user);
        IERC20(USDC).approve(address(investclpd), type(uint256).max);

        // User approves the swap contract to spend their CLPD
        vm.prank(user);
        IERC20(CLPD).approve(address(investclpd), type(uint256).max);

        // Perform the swap
        vm.prank(user);
        uint256 amountOut = investclpd.swapTokens(USDC, CLPD, 10000);

        console.log("Swapped 10000 USDC for", amountOut, "CLPD");
    }

    // ---------------------------------------------- investWithUSDC tests ----------------------------------------------
    function testInvestWithUSDC() public {
        // User approves the swap contract to spend their USDC
        vm.prank(user);
        IERC20(USDC).approve(address(investclpd), type(uint256).max);

        // User approves the swap contract to spend their CLPD
        vm.prank(user);
        IERC20(CLPD).approve(address(investclpd), type(uint256).max);

        // Check initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialCLPDBalance = IERC20(CLPD).balanceOf(user);

        console.log("Initial USDC balance:", initialUSDCBalance);
        console.log("Initial CLPD balance:", initialCLPDBalance);

        // Ensure user has enough balance
        require(initialUSDCBalance >= 10000, "Insufficient USDC balance");
        require(initialCLPDBalance > 0, "Insufficient CLPD balance");

        // Perform the investment
        vm.prank(user);
        (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) = investclpd.investWithUSDC(10000);

        console.log("Invested 0.01 USDC");
        console.log("Received NFT with token ID:", tokenId);
        console.log("Liquidity added:", liquidity);
        console.log("CLPD amount:", amount0);
        console.log("USDC amount:", amount1);

        // Check final balances
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalCLPDBalance = IERC20(CLPD).balanceOf(user);

        console.log("Final USDC balance:", finalUSDCBalance);
        console.log("Final CLPD balance:", finalCLPDBalance);

        // Assert that balances have changed
        assert(finalUSDCBalance < initialUSDCBalance);
        assert(finalCLPDBalance < initialCLPDBalance);

        // Assert that we received an NFT
        assert(tokenId > 0);
    }

    // ---------------------------------------------- investWithCLPD tests ----------------------------------------------
    function testInvestWithCLPD() public {
        // User approves the swap contract to spend their USDC
        vm.prank(user);
        IERC20(USDC).approve(address(investclpd), type(uint256).max);

        // User approves the swap contract to spend their CLPD
        vm.prank(user);
        IERC20(CLPD).approve(address(investclpd), type(uint256).max);

        // Check initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialCLPDBalance = IERC20(CLPD).balanceOf(user);

        console.log("Initial USDC balance:", initialUSDCBalance);
        console.log("Initial CLPD balance:", initialCLPDBalance);

        // Ensure user has enough balance
        require(initialUSDCBalance > 0, "Insufficient USDC balance");
        require(initialCLPDBalance > 1000000000000000000000, "Insufficient CLPD balance");

        // Perform the investment
        vm.prank(user);
        (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) = investclpd.investWithCLPD(1000000000000000000000);

        console.log("Invested 1000 CLPD");
        console.log("Received NFT with token ID:", tokenId);
        console.log("Liquidity added:", liquidity);
        console.log("CLPD amount:", amount0);
        console.log("USDC amount:", amount1);

        // Check final balances
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalCLPDBalance = IERC20(CLPD).balanceOf(user);

        console.log("Final USDC balance:", finalUSDCBalance);
        console.log("Final CLPD balance:", finalCLPDBalance);

        // Assert that balances have changed
        assert(finalUSDCBalance < initialUSDCBalance);
        assert(finalCLPDBalance < initialCLPDBalance);

        // Assert that we received an NFT
        assert(tokenId > 0);
    }

    // ---------------------------------------------- investUSDCwithoutCLPD tests ----------------------------------------------
    function testInvestUSDCwithoutCLPD() public {
        // User approves the swap contract to spend their USDC
        vm.prank(user);
        IERC20(USDC).approve(address(investclpd), type(uint256).max);

        // User approves the swap contract to spend their CLPD
        vm.prank(user);
        IERC20(CLPD).approve(address(investclpd), type(uint256).max);

        // Check initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialCLPDBalance = IERC20(CLPD).balanceOf(user);

        console.log("Initial USDC balance:", initialUSDCBalance);
        console.log("Initial CLPD balance:", initialCLPDBalance);

        // Ensure user has enough USDC balance
        require(initialUSDCBalance >= 100000, "Insufficient USDC balance");

        // Perform the investment
        vm.prank(user);
        (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) = investclpd.investUSDCwithoutCLPD(100000);

        // Calculate the amount of CLPD received from the swap (half of the initial USDC)
        uint256 swappedCLPD = amount0 - (100000 / 2);

        console.log("Invested 0.1 USDC");
        console.log("Received NFT with token ID:", tokenId);
        console.log("Liquidity added:", liquidity);
        console.log("CLPD amount added to liquidity:", amount0);
        console.log("USDC amount added to liquidity:", amount1);
        console.log("CLPD received from swap:", swappedCLPD);

        // Check final balances
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalCLPDBalance = IERC20(CLPD).balanceOf(user);

        console.log("Final USDC balance:", finalUSDCBalance);
        console.log("Final CLPD balance:", finalCLPDBalance);

        // Assert that balances have changed
        assert(finalUSDCBalance < initialUSDCBalance);
        assert(finalCLPDBalance >= initialCLPDBalance);

        // Assert that we received an NFT
        assert(tokenId > 0);

        // Assert that we added liquidity
        assert(amount0 > 0);
        assert(amount1 > 0);

        // Assert that we received CLPD from the swap
        assert(swappedCLPD > 0);
    }

    // ---------------------------------------------- investCLPDwithoutUSDC tests ----------------------------------------------
    function testinvestCLPDwithoutUSDC() public {
        // User approves the swap contract to spend their USDC
        vm.prank(user);
        IERC20(USDC).approve(address(investclpd), type(uint256).max);

        // User approves the swap contract to spend their CLPD
        vm.prank(user);
        IERC20(CLPD).approve(address(investclpd), type(uint256).max);

        // Check initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialCLPDBalance = IERC20(CLPD).balanceOf(user);

        console.log("Initial USDC balance:", initialUSDCBalance);
        console.log("Initial CLPD balance:", initialCLPDBalance);

        // Ensure user has enough CLPD balance
            require(initialCLPDBalance >= 1000000000000000000000, "Insufficient CLPD balance");

        // Perform the investment
        vm.prank(user);
        (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) = investclpd.investCLPDwithoutUSDC(1000000000000000000000);

        console.log("Invested 1000 CLPD");
        console.log("Received NFT with token ID:", tokenId);
        console.log("Liquidity added:", liquidity);
        console.log("CLPD amount added to liquidity:", amount0);
        console.log("USDC amount added to liquidity:", amount1);

        // Check final balances
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 finalCLPDBalance = IERC20(CLPD).balanceOf(user);

        console.log("Final USDC balance:", finalUSDCBalance);
        console.log("Final CLPD balance:", finalCLPDBalance);

        // Assert that balances have changed
        assert(finalUSDCBalance >= initialUSDCBalance);
        assert(finalCLPDBalance < initialCLPDBalance);

        // Assert that we received an NFT
        assert(tokenId > 0);

        // Assert that we added liquidity
        assert(amount0 > 0);
        assert(amount1 > 0);
    }
}