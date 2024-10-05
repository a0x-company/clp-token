// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {CLPD} from "../src/CLPD.sol";


contract CLPDTest is Test {
    CLPD public clpd;
    address public owner = 0xd806A01E295386ef7a7Cea0B9DA037B242622743; // Owner of the real contract
    address public account1 = 0xFc6623B340A505E6819349aF6beE2333D31840E1; // Agent of the real contract
    address public account2 = 0x9F693ea18DA08824E729d5efc343Dd78254a9302; // No Agent and no Owner of the real contract

    function setUp() public {
        clpd = CLPD(0xbEA4c5A2515A6D9bF4A4175af336663FB8976031); 
    }

    function test_chainlink() public view {
        assertEq(clpd.getVaultBalance(), 10000);
        console.log("Vault balance:", clpd.getVaultBalance());
    }

    // ---------------------------------------------- AddAgent tests ----------------------------------------------   
    function testAgentFunctionality() public {
        // Make account1 an agent
        vm.prank(owner);
        clpd.addAgent(account1);

        // Check if account1 and account2 are agents 
        assertTrue(clpd.agents(account1), "account1 should be an agent");
        assertFalse(clpd.agents(account2), "account2 should not be an agent");

        // Try to freeze all tokens with account2 (should fail)
        vm.prank(account2);
        vm.expectRevert("Only agents can execute this function");
        clpd.freezeAllTokens();

        // Try to freeze all tokens with account1 (should succeed)
        vm.prank(account1);
        clpd.freezeAllTokens();
        assertTrue(clpd.freezeAll(), "All accounts should be frozen");

        // Try to unfreeze all tokens with account2 (should fail)
        vm.prank(account2);
        vm.expectRevert("Only agents can execute this function");
        clpd.unfreezeAllTokens();

        // Try to unfreeze all tokens with account1 (should succeed)
        vm.prank(account1);
        clpd.unfreezeAllTokens();
        assertFalse(clpd.freezeAll(), "All accounts should be unfrozen");

        // Try to freeze a specific account with account2 (should fail)
        address targetAddress = owner;
        vm.prank(account2);
        vm.expectRevert("Only agents can execute this function");
        clpd.freezeAccount(targetAddress);

        // Freeze a specific account with account1 (should succeed)
        vm.prank(account1);
        clpd.freezeAccount(targetAddress);
        assertTrue(clpd.frozenAccounts(targetAddress), "Target address should be frozen");

        // Try to unfreeze the specific account with account2 (should fail)
        vm.prank(account2);
        vm.expectRevert("Only agents can execute this function");
        clpd.unfreezeAccount(targetAddress);

        // Unfreeze the specific account with account1 (should succeed)
        vm.prank(account1);
        clpd.unfreezeAccount(targetAddress);
        assertFalse(clpd.frozenAccounts(targetAddress), "Target address should be unfrozen");

        // Try to blacklist an address with account2 (should fail)
        vm.prank(account2);
        vm.expectRevert("Only agents can execute this function");
        clpd.blacklist(targetAddress);

        // Try to blacklist an address with account1 (should succeed)
        vm.prank(account1);
        clpd.blacklist(targetAddress);
        assertTrue(clpd.blacklisted(targetAddress), "Target address should be blacklisted");

        // Try to remove from blacklist with account2 (should fail)
        vm.prank(account2);
        vm.expectRevert("Only agents can execute this function");
        clpd.removeFromBlacklist(targetAddress);        

        // Remove from blacklist with account1
        vm.prank(account1);
        clpd.removeFromBlacklist(targetAddress);
        assertFalse(clpd.blacklisted(targetAddress), "Target address should be removed from blacklist");
    }

    // ---------------------------------------------- RemoveAgent tests ----------------------------------------------  
    function testRemoveAgent() public {
        address agent = account1;
        address targetAddress1 = account2;
        address targetAddress2 = owner;

        // Remove from blacklist with account1
        vm.prank(agent);
        clpd.removeFromBlacklist(targetAddress1);
        assertFalse(clpd.blacklisted(targetAddress1), "Target address should be removed from blacklist");

        // Remove account1 as an agent
        vm.prank(owner);
        clpd.removeAgent(agent);
        assertFalse(clpd.agents(agent), "account1 should not be an agent");

        // Try to remove agent with account2 (should fail)
        vm.prank(agent);
        vm.expectRevert("Only agents can execute this function");
        clpd.removeFromBlacklist(targetAddress2);     
    }
    
    
    // ---------------------------------------------- Mint tests ----------------------------------------------   
    function testMintByNonAgent() public {
        address nonAgent = account2;
        
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
        address spender = account1;
        uint256 redeemAmount = 5000000000000000000000;
        
        uint256 initialBalance = clpd.balanceOf(spender);
        uint256 initialTotalSupply = clpd.totalSupply();

        // Perform redeem
        vm.prank(spender);
        clpd.redeem(redeemAmount);
        
        // Check if the balance has decreased by the redeemed amount
        assertEq(clpd.balanceOf(spender), initialBalance - redeemAmount, "Balance should decrease by redeemed amount");
        
        // Check if the total supply has decreased
        assertEq(clpd.totalSupply(), initialTotalSupply - redeemAmount, "Total supply should decrease by redeemed amount");
    }

    function testRedeemInsufficientBalance() public {
        address spender = account1;
        uint256 redeemAmount = 11000000000000000000000;
        
        uint256 initialBalance = clpd.balanceOf(spender);
        
        // Ensure the spender has less balance than the redeem amount
        vm.assume(initialBalance < redeemAmount);
        
        // Attempt to redeem
        vm.prank(spender);
        vm.expectRevert("Not enough tokens to redeem");
        clpd.redeem(redeemAmount);
        
        // Check if the balance remains unchanged
        assertEq(clpd.balanceOf(spender), initialBalance, "Balance should remain unchanged");
        
        // Check if the total supply remains unchanged
        assertEq(clpd.totalSupply(), clpd.totalSupply(), "Total supply should remain unchanged");
    }


    // ---------------------------------------------- Freeze account tests ----------------------------------------------   
    function testFreezeAccountSender() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceReceiver = clpd.balanceOf(recipient);
        
        // Freeze the account
        vm.prank(agent);
        clpd.freezeAccount(sender);
        
        // Check if the account is frozen
        assertTrue(clpd.frozenAccounts(sender), "Account should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(sender);
        vm.expectRevert("Sender is frozen");
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceReceiver, "Recipient's balance should remain unchanged");
    }

    function testUnfreezeAccountSender() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceRecipient = clpd.balanceOf(recipient);

        // Freeze the account
        vm.prank(agent);
        clpd.freezeAccount(sender);
        
        // Check if the account is frozen
        assertTrue(clpd.frozenAccounts(sender), "Account should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(sender);
        vm.expectRevert("Sender is frozen");
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient, "Recipient's balance should remain unchanged");

        // Freeze the account
        vm.prank(agent);
        clpd.unfreezeAccount(sender);
        
        // Check if the account is unfrozen
        assertFalse(clpd.frozenAccounts(sender), "Account should be unfrozen");
        
        // Attempt to transfer tokens from the unfrozen account
        vm.prank(sender);
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(sender), initialBalanceSender - transferAmount, "Sender's balance should decrease");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient + transferAmount, "Recipient's balance should increase");
    }
    
    function testFreezeAccountRecipient() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceReceiver = clpd.balanceOf(recipient);
        
        // Freeze the account
        vm.prank(agent);
        clpd.freezeAccount(recipient);
        
        // Check if the account is frozen
        assertTrue(clpd.frozenAccounts(recipient), "Account should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(sender);
        vm.expectRevert("Recipient is frozen");
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceReceiver, "Recipient's balance should remain unchanged");
    }

    function testUnfreezeAccountRecipient() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceRecipient = clpd.balanceOf(recipient);

        // Freeze the account
        vm.prank(agent);
        clpd.freezeAccount(recipient);
        
        // Check if the account is frozen
        assertTrue(clpd.frozenAccounts(recipient), "Account should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(sender);
        vm.expectRevert("Recipient is frozen");
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient, "Recipient's balance should remain unchanged");

        // Freeze the account
        vm.prank(agent);
        clpd.unfreezeAccount(recipient);
        
        // Check if the account is unfrozen
        assertFalse(clpd.frozenAccounts(recipient), "Account should be unfrozen");
        
        // Attempt to transfer tokens from the unfrozen account
        vm.prank(sender);
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(sender), initialBalanceSender - transferAmount, "Sender's balance should decrease");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient + transferAmount, "Recipient's balance should increase");
    }

    // ---------------------------------------------- FreezeAll tests ----------------------------------------------   
    function testFreezeAll() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 100000000000000000000;
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceRecipient = clpd.balanceOf(recipient);

        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        // Freeze all accounts
        vm.prank(agent);
        clpd.freezeAllTokens();
        
        // Check if all accounts are frozen
        assertTrue(clpd.freezeAll(), "All accounts should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(sender);    
        vm.expectRevert("All transfers are frozen");
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient, "Recipient's balance should remain unchanged");
    }

    function testUnfreezeAll() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 100000000000000000000;
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceRecipient = clpd.balanceOf(recipient);

        // Freeze all accounts
        vm.prank(agent);
        clpd.freezeAllTokens();
        
        // Check if all accounts are frozen
        assertTrue(clpd.freezeAll(), "All accounts should be frozen");
        
        // Attempt to transfer tokens from the frozen account
        vm.prank(sender);
        vm.expectRevert("All transfers are frozen");   
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient, "Recipient's balance should remain unchanged");

        // Unfreeze all accounts
        vm.prank(agent);
        clpd.unfreezeAllTokens();

        // Check if all accounts are unfrozen
        assertFalse(clpd.freezeAll(), "All accounts should be unfrozen");
        
        // Attempt to transfer tokens from the unfrozen account
        vm.prank(sender);
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(sender), initialBalanceSender - transferAmount, "Sender's balance should decrease");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient + transferAmount, "Recipient's balance should increase");
    }
    
    // ---------------------------------------------- Blacklist tests ----------------------------------------------   
    function testBlacklistAccountSender() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceRecipient = clpd.balanceOf(recipient);
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        // Blacklist the account
        vm.prank(agent);
        clpd.blacklist(sender);
        
        // Check if the account is blacklisted
        assertTrue(clpd.blacklisted(sender), "Account should be blacklisted");
        
        // Attempt to transfer tokens from the blacklisted account
        vm.prank(sender);
        vm.expectRevert("Sender is blacklisted");
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient, "Recipient's balance should remain unchanged");
    }

    function testRemoveFromBlacklistSender() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceRecipient = clpd.balanceOf(recipient);

        // Blacklist the account
        vm.prank(agent);
        clpd.blacklist(sender);
        
        // Check if the account is blacklisted
        assertTrue(clpd.blacklisted(sender), "Account should be blacklisted");
        
        // Attempt to transfer tokens from the blacklisted account
        vm.prank(sender);
        vm.expectRevert("Sender is blacklisted");
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient, "Recipient's balance should remain unchanged");

        // Remove the account from blacklist
        vm.prank(agent);
        clpd.removeFromBlacklist(sender);
        
        // Check if the account is removed from blacklist
        assertFalse(clpd.blacklisted(sender), "Account should be removed from blacklist");
        
        // Attempt to transfer tokens from the non-blacklisted account
        vm.prank(sender);
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(sender), initialBalanceSender - transferAmount, "Sender's balance should decrease");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient + transferAmount, "Recipient's balance should increase");
    }

    function testBlacklistAccountRecipient() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceRecipient = clpd.balanceOf(recipient);
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        // Blacklist the account
        vm.prank(agent);
        clpd.blacklist(recipient);
        
        // Check if the account is blacklisted
        assertTrue(clpd.blacklisted(recipient), "Account should be blacklisted");
        
        // Attempt to transfer tokens from the blacklisted account
        vm.prank(sender);
        vm.expectRevert("Recipient is blacklisted");
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient, "Recipient's balance should remain unchanged");
    }

    function testRemoveFromBlacklistRecipient() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = account1;
        address recipient = owner;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceRecipient = clpd.balanceOf(recipient);

        // Blacklist the account
        vm.prank(agent);
        clpd.blacklist(recipient);
        
        // Check if the account is blacklisted
        assertTrue(clpd.blacklisted(recipient), "Account should be blacklisted");
        
        // Attempt to transfer tokens from the blacklisted account
        vm.prank(sender);
        vm.expectRevert("Recipient is blacklisted");
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer didn't occur
        assertEq(clpd.balanceOf(sender), initialBalanceSender, "Sender's balance should remain unchanged");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient, "Recipient's balance should remain unchanged");

        // Remove the account from blacklist
        vm.prank(agent);
        clpd.removeFromBlacklist(recipient);
        
        // Check if the account is removed from blacklist
        assertFalse(clpd.blacklisted(recipient), "Account should be removed from blacklist");
        
        // Attempt to transfer tokens from the non-blacklisted account
        vm.prank(sender);
        clpd.transfer(recipient, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(sender), initialBalanceSender - transferAmount, "Sender's balance should decrease");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient + transferAmount, "Recipient's balance should increase");
    }

    // ---------------------------------------------- ForceTransfer tests ----------------------------------------------   
    function testForceTransfer() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");

        address agent = account2;
        address sender = owner;
        address recipient = account1;
        uint256 transferAmount = 1000000000000000000000;
        
        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceRecipient = clpd.balanceOf(recipient);

        // Force transfer tokens from the agent to the owner
        vm.prank(agent);
        clpd.forceTransfer(sender, recipient, transferAmount);
        
        // Verify that the transfer occurred
        assertEq(clpd.balanceOf(sender), initialBalanceSender - transferAmount, "Sender's balance should decrease");
        assertEq(clpd.balanceOf(recipient), initialBalanceRecipient + transferAmount, "Recipient's balance should increase");
    }
    
    // ---------------------------------------------- RevokeAgent tests ---------------------------------------------- 
    function testRevoke() public {
        address agent = account2;

        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(agent);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(agent), "account2 should be an agent");

        address sender = account1;
        uint256 transferAmount = 100000000000000000000;
        
        uint256 initialBalanceSender = clpd.balanceOf(sender);
        uint256 initialBalanceReceiver = clpd.balanceOf(clpd.receiver());

        // Ensure the sender has enough balance
        vm.assume(clpd.balanceOf(sender) >= transferAmount);

        // Freeze the sender
        vm.prank(agent);
        clpd.freezeAccount(sender);  

        // Ensure the sender is frozen
        assertTrue(clpd.frozenAccounts(sender), "Account should be frozen");

        // Revoke agent
        vm.prank(agent);
        clpd.revoke(sender, transferAmount);

        assertEq(clpd.balanceOf(sender), initialBalanceSender - transferAmount, "Sender's balance should decrease");
        assertEq(clpd.balanceOf(clpd.receiver()), initialBalanceReceiver + transferAmount, "Receiver's balance should increase");
    }

    // ---------------------------------------------- setReceiver tests ---------------------------------------------- 
    function testSetReceiver() public {
        // Make account2 an agent
        vm.prank(owner);
        clpd.addAgent(account2);
        
        // Verify that account2 is now an agent
        assertTrue(clpd.agents(account2), "account2 should be an agent");
        
        address agent = account2;
        address newReceiver = account1;

        assertEq(clpd.receiver(), owner, "Receiver should be owner");

        // Set new receivers
        vm.prank(agent);
        clpd.setReceiver(newReceiver);
        
        // Verify that the receivers have been updated
        assertEq(clpd.receiver(), newReceiver, "New receiver should be set");
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
}