// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/swap_CLPD.sol";

contract DeploySwapCLPD is Script {
    
    function run() external {
        // Read private key or account from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting the transaction
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the GenericTokenSwap contract
        SwapCLPD swapContract = new SwapCLPD();

        // Log the deployed contract address
        console.log("swapCLPD contract deployed at:", address(swapContract));

        // Stop broadcasting
        vm.stopBroadcast();
    }
}