// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BlockVaultVerifier} from "../src/Verifier.sol";

contract VerifierTest is Test {
    BlockVaultVerifier public verifier;

    address public user = address(0x1234);
    address public maliciousUser = address(0x5678);
    bytes32 public validStorageSlot;
    
    // Mock proofs
    bytes[] public mockAccountProof;
    bytes[] public mockStorageProof;

    function setUp() public {
        verifier = new BlockVaultVerifier();
        
        // Mock a valid storage slot (in reality this is keccak256(abi.encode(user, mappingSlot)))
        validStorageSlot = bytes32(uint256(1));
        
        // Push dummy proof data to bypass the empty check
        mockAccountProof.push(bytes("dummy"));
        mockStorageProof.push(bytes("dummy"));
    }

    function test_submitProof_success() public {
        vm.startPrank(user);
        
        // Should succeed because slot and user are non-zero/valid
        verifier.submitProof(
            1000, 
            validStorageSlot, 
            mockAccountProof, 
            mockStorageProof
        );
        
        assertTrue(verifier.isVerified(user));
        vm.stopPrank();
    }

    function test_submitProof_revertsIfZeroSlot() public {
        vm.startPrank(user);
        
        vm.expectRevert("Storage slot does not belong to sender");
        verifier.submitProof(
            1000, 
            bytes32(0), // Zero slot
            mockAccountProof, 
            mockStorageProof
        );
        
        vm.stopPrank();
    }
    
    function test_submitProof_revertsIfEmptyProof() public {
        vm.startPrank(user);
        
        bytes[] memory emptyProof;
        
        vm.expectRevert("Invalid proof payload");
        verifier.submitProof(
            1000, 
            validStorageSlot, 
            emptyProof, 
            mockStorageProof
        );
        
        vm.stopPrank();
    }
}
