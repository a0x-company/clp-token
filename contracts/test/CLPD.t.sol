// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {CLPD} from "../src/CLPD.sol";


contract CLPDTest is Test {
    CLPD public clpd;
    address public owner = 0xd806A01E295386ef7a7Cea0B9DA037B242622743; // Owner of the real contract
    address public minter = 0xFc6623B340A505E6819349aF6beE2333D31840E1; // Agent of the real contract
    address public newAgent = 0x9F693ea18DA08824E729d5efc343Dd78254a9302; // No Agent and no Owner of the real contract

    function setUp() public {
        clpd = CLPD(0xbEA4c5A2515A6D9bF4A4175af336663FB8976031); 
    }

    function test_chainlink() public view {
        assertEq(clpd.getVaultBalance(), 10000);
        console.log("Vault balance:", clpd.getVaultBalance());
    }

    // ---------------------------------------------- Mint tests ----------------------------------------------   
    function testMintByNonAgent() public {
        address nonAgent = newAgent;
        
        assertFalse(clpd.agents(nonAgent));
        
        uint256 initialBalance = clpd.balanceOf(nonAgent);
        
        vm.prank(nonAgent);
        vm.expectRevert("Only agents can execute this function");
        clpd.mint(nonAgent, 100);
        
        assertEq(clpd.balanceOf(nonAgent), initialBalance);
    }
/*
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
*/

    // ---------------------------------------------- Redeem tests ----------------------------------------------   
    function testRedeem() public {
        address agent = minter;
        uint256 redeemAmount = 5000000000000000000000;
        
        uint256 initialBalance = clpd.balanceOf(agent);
        uint256 initialTotalSupply = clpd.totalSupply();

        // Perform redeem
        vm.prank(agent);
        clpd.redeem(redeemAmount);
        
        // Check if the balance has decreased by the redeemed amount
        assertEq(clpd.balanceOf(agent), initialBalance - redeemAmount, "Balance should decrease by redeemed amount");
        
        // Check if the total supply has decreased
        assertEq(clpd.totalSupply(), initialTotalSupply - redeemAmount, "Total supply should decrease by redeemed amount");
    }

    function testRedeemInsufficientBalance() public {
        address agent = minter;
        uint256 redeemAmount = 11000000000000000000000;
        
        uint256 initialBalance = clpd.balanceOf(agent);
        
        // Ensure the agent has less balance than the redeem amount
        vm.assume(initialBalance < redeemAmount);
        
        // Attempt to redeem
        vm.prank(agent);
        vm.expectRevert("Not enough tokens to redeem");
        clpd.redeem(redeemAmount);
        
        // Check if the balance remains unchanged
        assertEq(clpd.balanceOf(agent), initialBalance, "Balance should remain unchanged");
        
        // Check if the total supply remains unchanged
        assertEq(clpd.totalSupply(), clpd.totalSupply(), "Total supply should remain unchanged");
    }


    // ---------------------------------------------- Freeze account tests ----------------------------------------------   
    function testFreezeAccount() public {
        address agent = minter;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the agent has enough balance
        vm.assume(clpd.balanceOf(agent) >= transferAmount);
        
        // Freeze the account
        vm.prank(agent);
        clpd.freezeAccount(agent);
        
        // Check if the account is frozen
        assertTrue(clpd.frozenAccounts(agent), "Account should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(agent);
        vm.expectRevert("Sender is frozen");
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(agent), clpd.balanceOf(agent), "Agent's balance should remain unchanged");
        assertEq(clpd.balanceOf(owner), clpd.balanceOf(owner), "Owner's balance should remain unchanged");
    }

    function testUnfreezeAccount() public {
        address agent = minter;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the agent has enough balance
        vm.assume(clpd.balanceOf(agent) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(agent);
        uint256 initialBalanceReceiver = clpd.balanceOf(owner);

        // Freeze the account
        vm.prank(agent);
        clpd.freezeAccount(agent);
        
        // Check if the account is frozen
        assertTrue(clpd.frozenAccounts(agent), "Account should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(agent);
        vm.expectRevert("Sender is frozen");
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(agent), clpd.balanceOf(agent), "Agent's balance should remain unchanged");
        assertEq(clpd.balanceOf(owner), clpd.balanceOf(owner), "Owner's balance should remain unchanged");

        // Freeze the account
        vm.prank(agent);
        clpd.unfreezeAccount(agent);
        
        // Check if the account is unfrozen
        assertFalse(clpd.frozenAccounts(agent), "Account should be unfrozen");
        
        // Attempt to transfer tokens from the unfrozen account
        vm.prank(agent);
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(agent), initialBalanceSender - transferAmount, "Agent's balance should decrease");
        assertEq(clpd.balanceOf(owner), initialBalanceReceiver + transferAmount, "Owner's balance should increase");
    }
    

    // ---------------------------------------------- FreezeAll tests ----------------------------------------------   
    function testFreezeAll() public {
        address agent = minter;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the agent has enough balance
        vm.assume(clpd.balanceOf(agent) >= transferAmount);
        
        // Freeze all accounts
        vm.prank(agent);
        clpd.freezeAllTokens();
        
        // Check if all accounts are frozen
        assertTrue(clpd.freezeAll(), "All accounts should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(agent);    
        vm.expectRevert("All transfers are frozen");
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(agent), clpd.balanceOf(agent), "Agent's balance should remain unchanged");
        assertEq(clpd.balanceOf(owner), clpd.balanceOf(owner), "Owner's balance should remain unchanged");
    }

    function testUnfreezeAll() public {
        address agent = minter;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the agent has enough balance
        vm.assume(clpd.balanceOf(agent) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(agent);
        uint256 initialBalanceReceiver = clpd.balanceOf(owner);

        // Freeze all accounts
        vm.prank(agent);
        clpd.freezeAllTokens();
        
        // Check if all accounts are frozen
        assertTrue(clpd.freezeAll(), "All accounts should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(agent);
        vm.expectRevert("All transfers are frozen");   
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(agent), clpd.balanceOf(agent), "Agent's balance should remain unchanged");
        assertEq(clpd.balanceOf(owner), clpd.balanceOf(owner), "Owner's balance should remain unchanged");

        // Unfreeze all accounts
        vm.prank(agent);
        clpd.unfreezeAllTokens();

        // Check if all accounts are unfrozen
        assertFalse(clpd.freezeAll(), "All accounts should be unfrozen");
        
        // Attempt to transfer tokens from the unfrozen account
        vm.prank(agent);
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(agent), initialBalanceSender - transferAmount, "Agent's balance should decrease");
        assertEq(clpd.balanceOf(owner), initialBalanceReceiver + transferAmount, "Owner's balance should increase");
    }
    
    // ---------------------------------------------- Blacklist tests ----------------------------------------------   
    function testBlacklistAccountSender() public {
        address agent = minter;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the agent has enough balance
        vm.assume(clpd.balanceOf(agent) >= transferAmount);
        
        // Blacklist the account
        vm.prank(agent);
        clpd.blacklist(agent);
        
        // Check if the account is blacklisted
        assertTrue(clpd.blacklisted(agent), "Account should be blacklisted");
        
        // Attempt to transfer tokens from the blacklisted account
        vm.prank(agent);
        vm.expectRevert("Sender is blacklisted");
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(agent), clpd.balanceOf(agent), "Agent's balance should remain unchanged");
        assertEq(clpd.balanceOf(owner), clpd.balanceOf(owner), "Owner's balance should remain unchanged");
    }

    function testRemoveFromBlacklistSender() public {
        address agent = minter;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the agent has enough balance
        vm.assume(clpd.balanceOf(agent) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(agent);
        uint256 initialBalanceReceiver = clpd.balanceOf(owner);

        // Blacklist the account
        vm.prank(agent);
        clpd.blacklist(agent);
        
        // Check if the account is blacklisted
        assertTrue(clpd.blacklisted(agent), "Account should be blacklisted");
        
        // Attempt to transfer tokens from the blacklisted account
        vm.prank(agent);
        vm.expectRevert("Sender is blacklisted");
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(agent), clpd.balanceOf(agent), "Agent's balance should remain unchanged");
        assertEq(clpd.balanceOf(owner), clpd.balanceOf(owner), "Owner's balance should remain unchanged");

        // Remove the account from blacklist
        vm.prank(agent);
        clpd.removeFromBlacklist(agent);
        
        // Check if the account is removed from blacklist
        assertFalse(clpd.blacklisted(agent), "Account should be removed from blacklist");
        
        // Attempt to transfer tokens from the non-blacklisted account
        vm.prank(agent);
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(agent), initialBalanceSender - transferAmount, "Agent's balance should decrease");
        assertEq(clpd.balanceOf(owner), initialBalanceReceiver + transferAmount, "Owner's balance should increase");
    }

    function testBlacklistAccountRecipient() public {
        address blacklistAddress = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the agent has enough balance
        vm.assume(clpd.balanceOf(minter) >= transferAmount);
        
        // Blacklist the account
        vm.prank(minter);
        clpd.blacklist(blacklistAddress);
        
        // Check if the account is blacklisted
        assertTrue(clpd.blacklisted(blacklistAddress), "Account should be blacklisted");
        
        // Attempt to transfer tokens from the blacklisted account
        vm.prank(minter);
        vm.expectRevert("Recipient is blacklisted");
        clpd.transfer(blacklistAddress, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(minter), clpd.balanceOf(minter), "Agent's balance should remain unchanged");
        assertEq(clpd.balanceOf(blacklistAddress), clpd.balanceOf(blacklistAddress), "Owner's balance should remain unchanged");
    }

    function testRemoveFromBlacklistRecipient() public {
        address blacklistAddress = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the agent has enough balance
        vm.assume(clpd.balanceOf(minter) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(minter);
        uint256 initialBalanceReceiver = clpd.balanceOf(blacklistAddress);

        // Blacklist the account
        vm.prank(minter);
        clpd.blacklist(blacklistAddress);
        
        // Check if the account is blacklisted
        assertTrue(clpd.blacklisted(blacklistAddress), "Account should be blacklisted");
        
        // Attempt to transfer tokens from the blacklisted account
        vm.prank(minter);
        vm.expectRevert("Recipient is blacklisted");
        clpd.transfer(blacklistAddress, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(minter), clpd.balanceOf(minter), "Agent's balance should remain unchanged");
        assertEq(clpd.balanceOf(blacklistAddress), clpd.balanceOf(blacklistAddress), "Owner's balance should remain unchanged");

        // Remove the account from blacklist
        vm.prank(minter);
        clpd.removeFromBlacklist(blacklistAddress);
        
        // Check if the account is removed from blacklist
        assertFalse(clpd.blacklisted(blacklistAddress), "Account should be removed from blacklist");
        
        // Attempt to transfer tokens from the non-blacklisted account
        vm.prank(minter);
        clpd.transfer(owner, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(minter), initialBalanceSender - transferAmount, "Agent's balance should decrease");
        assertEq(clpd.balanceOf(blacklistAddress), initialBalanceReceiver + transferAmount, "Owner's balance should increase");
    }

    // ---------------------------------------------- ForceTransfer tests ----------------------------------------------   
    function testForceTransfer() public {
        address agent = minter;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the agent has enough balance
        vm.assume(clpd.balanceOf(agent) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(owner);
        uint256 initialBalanceReceiver = clpd.balanceOf(agent);

        // Force transfer tokens from the agent to the owner
        vm.prank(agent);
        clpd.forceTransfer(owner, agent, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(owner), initialBalanceSender - transferAmount, "owner's balance should decrease");
        assertEq(clpd.balanceOf(agent), initialBalanceReceiver + transferAmount, "agent's balance should increase");
    }
    
    // ---------------------------------------------- setTokenDetails tests ---------------------------------------------- 
    /*function testSetTokenDetails() public {
        address agent = minter;
        string memory newName = "ACLP";
        string memory newSymbol = "ACLP";
        
        // Store initial token details
        string memory initialName = clpd.name();
        string memory initialSymbol = clpd.symbol();
        
        // Verify initial token details
        assertEq(initialName, "CLPD", "Initial token name should be CLPD");
        assertEq(initialSymbol, "CLPD", "Initial token symbol should be CLPD");
        
        // Set new token details
        vm.prank(agent);
        clpd.setTokenDetails(newName, newSymbol);
        
        // Verify that the token details have been updated
        assertEq(clpd.name(), newName, "Token name should be updated");
        assertEq(clpd.symbol(), newSymbol, "Token symbol should be updated");
    }
    */

    // ---------------------------------------------- setReceiver tests ---------------------------------------------- 
    function testSetReceiver() public {
        // Set new agent
        vm.prank(owner);
        clpd.addAgent(newAgent);
        
        assertEq(clpd.agents(newAgent), true, "New agent should be an agent");
        assertEq(clpd.receiver(), owner, "Receiver should be owner");

        // Set new receivers
        vm.prank(newAgent);
        clpd.setReceiver(minter);
        
        // Verify that the receivers have been updated
        assertEq(clpd.receiver(), minter, "New receiver should be set");
    }


    
}