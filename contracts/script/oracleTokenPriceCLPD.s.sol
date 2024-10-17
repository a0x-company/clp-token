// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/oracleTokenPriceCLPD.sol";

contract DeployOracleTokenPriceCLPD is Script {
    
    function run() external {
        // Read private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting the transaction
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the oracleTokenPriceCLPD contract
        oracleTokenPriceCLPD oracle = new oracleTokenPriceCLPD();

        // Log the deployed contract address
        console.log("oracleTokenPriceCLPD contract deployed at:", address(oracle));

        // Stop broadcasting
        vm.stopBroadcast();
    }
}