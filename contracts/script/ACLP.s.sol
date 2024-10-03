// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/ACLP.sol";

contract DeployACLP is Script {
    function run() external {
        // Dirección del receptor de tokens
        address receiver = payable(0xd806A01E295386ef7a7Cea0B9DA037B242622743);

        // Inicia la transacción de despliegue
        vm.startBroadcast();

        // Desplegar el contrato ACLP
        ACLP aclp = new ACLP(receiver);

        // Finaliza la transacción
        vm.stopBroadcast();

        // Log del contrato desplegado
        console.log("ACLP deployed at:", address(aclp));
    }
}
