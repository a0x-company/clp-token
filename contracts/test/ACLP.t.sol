// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {ACLP} from "../src/ACLP.sol";


contract ACLPTest is Test {
    ACLP public aclp;
    address public receiver = 0xd806A01E295386ef7a7Cea0B9DA037B242622743;
    uint256 testNumber;

    function setUp() public {
        aclp = ACLP(0x1DAC78199Aa2fc6926b9D9Cb77b914153C978C90); 
    }

    function test_chainlink() public view {
        assertEq(aclp.vaultBalance(), 10000);
        console.log("Vault balance:", aclp.vaultBalance());
        
    } 
}