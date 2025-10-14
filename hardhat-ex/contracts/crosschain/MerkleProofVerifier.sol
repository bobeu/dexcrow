// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { ICrossChainEscrow } from "./interfaces/ICrossChainEscrow.sol";

/**
 * @title MerkleProofVerifier
 * @dev Merkle proof verification for cross-chain state validation
 * @notice Provides secure verification of cross-chain messages and state
 */
contract MerkleProofVerifier {
    /// @notice Merkle tree storage
    mapping(bytes32 => bytes32) public merkleRoots;
    mapping(bytes32 => bool) public processedProofs;
    
    /// @notice Events
    event MerkleRootUpdated(bytes32 indexed root, uint256 timestamp);
    event ProofVerified(bytes32 indexed proofHash, bool valid);

    /**
     * @notice Update Merkle root for a specific chain
     * @param chainId Chain ID
     * @param root New Merkle root
     */
    function updateMerkleRoot(uint256 chainId, bytes32 root) external {
        require(root != bytes32(0), "MerkleProofVerifier: Invalid root");
        
        merkleRoots[keccak256(abi.encodePacked(chainId))] = root;
        
        emit MerkleRootUpdated(root, block.timestamp);
    }

    /**
     * @notice Verify Merkle proof for cross-chain message
     * @param message Cross-chain message
     * @param proof Merkle proof
     * @param chainId Source chain ID
     * @return valid Whether proof is valid
     */
    function verifyCrossChainMessage(
        ICrossChainEscrow.CrossChainMessage calldata message,
        bytes32[] calldata proof,
        uint256 chainId
    ) external returns (bool) {
        bytes32 proofHash = keccak256(abi.encode(message, proof, chainId));
        require(!processedProofs[proofHash], "MerkleProofVerifier: Proof already processed");
        
        bytes32 leaf = keccak256(abi.encode(message));
        bytes32 root = merkleRoots[keccak256(abi.encodePacked(chainId))];
        
        bool valid = verifyMerkleProof(proof, root, leaf);
        
        if (valid) {
            processedProofs[proofHash] = true;
        }
        
        emit ProofVerified(proofHash, valid);
        
        return valid;
    }

    /**
     * @notice Verify Merkle proof
     * @param proof Merkle proof
     * @param root Merkle root
     * @param leaf Leaf hash
     * @return valid Whether proof is valid
     */
    function verifyMerkleProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) public pure returns (bool) {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == root;
    }

    /**
     * @notice Get Merkle root for a chain
     * @param chainId Chain ID
     * @return root Merkle root
     */
    function getMerkleRoot(uint256 chainId) external view returns (bytes32) {
        return merkleRoots[keccak256(abi.encodePacked(chainId))];
    }

    /**
     * @notice Check if proof has been processed
     * @param proofHash Proof hash
     * @return processed Whether proof has been processed
     */
    function isProofProcessed(bytes32 proofHash) external view returns (bool) {
        return processedProofs[proofHash];
    }
}
