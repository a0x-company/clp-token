// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {oracleTokenPriceCLPD} from "../src/oracleTokenPriceCLPD.sol";

/**
 * To run this contract, copy and paste this command in the terminal:
 * forge test -vvvv --match-path test/oracleTokenPriceCLPD.t.sol --fork-url https://mainnet.base.org/
 * 
 * @dev Contract deployed on Base Mainnet
 * https://basescan.org/address/0xFba35c65C3cfCA94d0d0d40F77F2A6eE0102EE4C
 */

contract oracleTokenPriceCLPDTest is Test {

    oracleTokenPriceCLPD public oracle;
    address public user = 0xFc6623B340A505E6819349aF6beE2333D31840E1;
    address public CLPD = 0x24460D2b3d96ee5Ce87EE401b1cf2FD01545d9b1;
    address public USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function setUp() public {
        oracle = oracleTokenPriceCLPD(0xFba35c65C3cfCA94d0d0d40F77F2A6eE0102EE4C);
    }

    // ---------------------------------------------- Swap tests ----------------------------------------------
    function testGetPriceCLPD() public {
        // Call the getPrice function
        uint256 price = oracle.getPrice(CLPD, 0);

        // Log the price for debugging
        console.log("CLPD Price in USDC:", price);

        // Assert that the price is greater than zero
        assertGt(price, 0, "Price should be greater than zero");

        // Assert that the price is within a reasonable range
        // Assuming CLPD is not expected to be worth more than 1000 USDC or less than 0.0001 USDC
        assertLt(price, 1000 * 1e6, "Price should be less than 1000 USDC");
        assertGt(price, 1e2, "Price should be greater than 0.0001 USDC");

        // Check if lastPrice is updated
        assertEq(oracle.lastPrice(), price, "lastPrice should be updated");
    }

    function testGetPriceUSDC() public {
        // Call the getPrice function for USDC
        uint256 price = oracle.getPrice(USDC, 0);

        // Log the price for debugging
        console.log("USDC Price in CLPD:", price);

        // Assert that the price is greater than zero
        assertGt(price, 0, "Price should be greater than zero");

        // Assert that the price is within a reasonable range
        // Assuming 1 USDC is worth between 0.001 and 1000 CLPD
        assertLt(price, 1000 * 1e18, "Price should be less than 1000 CLPD");
        assertGt(price, 1e15, "Price should be greater than 0.001 CLPD");

        // Check if lastPrice is updated
        assertEq(oracle.lastPrice(), price, "lastPrice should be updated");
    }


    // ---------------------------------------------- Set pool address tests ----------------------------------------------

    function testSetPoolAddress() public {
        address newPoolAddress = address(0x1234567890123456789012345678901234567890);

        // Only owner should be able to set the pool address
        vm.prank(user);
        vm.expectRevert("Only owner can call this function");
        oracle.setPoolAddress(newPoolAddress);

        // Set pool address as owner
        vm.prank(oracle.owner());
        oracle.setPoolAddress(newPoolAddress);

        // Check if pool address is updated
        assertEq(oracle.POOL_ADDRESS(), newPoolAddress, "Pool address should be updated");
    }

}