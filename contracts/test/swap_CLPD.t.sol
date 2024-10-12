// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {SwapCLPD} from "../src/swap_CLPD.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * To run this contract, copy and paste this command in the terminal:
 * forge test -vvvv --match-path test/swap_CLPD.t.sol --fork-url https://mainnet.base.org/
 * 
 * @dev Contract deployed on Base Mainnet
 * https://basescan.org/address/0x969291bEB92fAa156C2c77C3d364E7b40428D096
 */

contract SwapCLPDTest is Test {

    SwapCLPD public swapclpd;
    address public user = 0xd806A01E295386ef7a7Cea0B9DA037B242622743;
    address public USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public CLPD = 0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1;

    function setUp() public {
        swapclpd = SwapCLPD(0x969291bEB92fAa156C2c77C3d364E7b40428D096);
    }

    // ---------------------------------------------- Swap tests ----------------------------------------------
    function testSwap() public {
        // User approves the swap contract to spend their USDC
        vm.prank(user);
        IERC20(USDC).approve(address(swapclpd), type(uint256).max);

        // User approves the swap contract to spend their CLPD
        vm.prank(user);
        IERC20(CLPD).approve(address(swapclpd), type(uint256).max);

        // Perform the swap
        vm.prank(user);
        uint256 amountOut = swapclpd.swapTokens(USDC, CLPD, 10000);

        console.log("Swapped 10000 USDC for", amountOut, "CLPD");
    }
}
