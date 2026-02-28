// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {BlockVaultSBT} from "../src/BlockVaultSBT.sol";

contract DeployVerifier is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        BlockVaultSBT verifier = new BlockVaultSBT();

        vm.stopBroadcast();
    }
}
