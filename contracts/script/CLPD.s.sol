// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/CLPD.sol";

contract DeployACLP is Script {
    // Address to receive the tokens
    address public receiver = 0x1234567890123456789012345678901234567890;

    function run() external {
        // Read private key or account from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting the transaction
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the CLPD contract
        CLPD clpd = new CLPD(receiver);

        // Log the deployed contract address
        console.log("CLPD contract deployed at:", address(clpd));

        // Stop broadcasting
        vm.stopBroadcast();
    }

}