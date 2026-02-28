// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

// Interfaces for ERC-5192 Minimal Soulbound Tokens
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

contract BlockVaultSBT is ERC721, IERC5192 {
    uint256 private _nextTokenId;

    struct ScoreMetadata {
        uint256 score;
        uint256 lastUpdated;
        uint256 totalRepays;
        uint256 liquidations;
    }

    // Mapping from tokenId to the user's detailed Financial Reliability Metadata
    mapping(uint256 => ScoreMetadata) public reliabilityScores;
    // Mapping from user address to their SBT tokenId (1 per user)
    mapping(address => uint256) public userSBT;

    // In a real ZK architecture, this would be the actual ZK Verifier contract address
    // For this hackathon, we are simulating the Oracle/Relayer signing the AI's score
    address public backendRelayer;

    constructor() ERC721("BlockVault Reputation", "BVR") {
        backendRelayer = msg.sender; // The admin deploying is the trusted backend relayer
    }

    /**
     * @dev Mints a non-transferrable Financial Reliability Score to the user.
     * Can only be called by the trusted ZK-Relayer (or AI Oracle backend).
     */
    function mintScoreSBT(address user, uint256 score, uint256 repays, uint256 liquidations) external {
        require(msg.sender == backendRelayer, "Only the trusted ZK-Relayer can mint scores");
        require(userSBT[user] == 0, "User already has a BlockVault SBT. Update it instead.");

        _nextTokenId++;
        uint256 newItemId = _nextTokenId;

        _safeMint(user, newItemId);

        reliabilityScores[newItemId] = ScoreMetadata({
            score: score,
            lastUpdated: block.timestamp,
            totalRepays: repays,
            liquidations: liquidations
        });

        userSBT[user] = newItemId;

        // Emitting ERC-5192 Locked event to signal this NFT cannot be transferred
        emit Locked(newItemId);
    }

    /**
     * @dev Updates an existing SBT with newly verified score data (Delta update)
     */
    function updateScore(address user, uint256 newScore, uint256 addedRepays, uint256 addedLiquidations) external {
        require(msg.sender == backendRelayer, "Only the trusted ZK-Relayer can update scores");
        uint256 tokenId = userSBT[user];
        require(tokenId != 0, "User does not have an SBT");

        ScoreMetadata storage metadata = reliabilityScores[tokenId];
        metadata.score = newScore;
        metadata.lastUpdated = block.timestamp;
        metadata.totalRepays += addedRepays;
        metadata.liquidations += addedLiquidations;
    }

    // --- ERC-5192 Minimal Soulbound Token Implementation ---
    function locked(uint256 /*tokenId*/) external pure override returns (bool) {
        return true; // All BlockVault SBTs are permanently locked to the wallet
    }

    // Override transfer functions to permanently disable transferring
    function transferFrom(address from, address to, uint256 tokenId) public override {
        revert("BlockVault SBT is Soulbound and non-transferrable");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        revert("BlockVault SBT is Soulbound and non-transferrable");
    }
}
