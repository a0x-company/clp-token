// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {CLPD} from "../src/CLPD.sol";


contract CLPDTest is Test {
    CLPD public clpd;
    address public owner = 0xd806A01E295386ef7a7Cea0B9DA037B242622743;
    address public minter = 0xFc6623B340A505E6819349aF6beE2333D31840E1;

    uint256 testNumber;

    function setUp() public {
        clpd = CLPD(0x1DAC78199Aa2fc6926b9D9Cb77b914153C978C90); 
    }

    function test_chainlink() public view {
        assertEq(clpd.vaultBalance(), 10000);
        console.log("Vault balance:", clpd.vaultBalance());
    }

    function testMintByNonAgent() public {
        address nonAgent = minter;
        
        assertFalse(clpd.agents(nonAgent));
        
        uint256 initialBalance = clpd.balanceOf(nonAgent);
        
        vm.prank(nonAgent);
        vm.expectRevert("Only agents can execute this function");
        clpd.mint(nonAgent, 100);
        
        assertEq(clpd.balanceOf(nonAgent), initialBalance);
    }

    function testMintByAgent() public {
        address agent = minter;
        uint256 mintAmount = 10000;
        
        // Make the owner add the minter as an agent
        vm.prank(owner);
        clpd.addAgent(agent);
        
        assertTrue(clpd.agents(agent), "Minter should be an agent");
        
        uint256 initialBalance = clpd.balanceOf(agent);
        
        // Now that the minter is an agent, they can mint
        vm.prank(agent);
        clpd.mint(agent, mintAmount);
        
        // Check if the balance has increased by the minted amount
        assertEq(clpd.balanceOf(agent), initialBalance + mintAmount, "Balance should increase by minted amount");
    }

}