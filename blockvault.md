# BlockVault Planning Document

## Overview

BlockVault is a trustless, on-chain credit scoring system. It bridges Generative AI with Web3 cryptography to offer under-collateralized loans. An AI Agent analyzes raw transaction history to extract positive financial behavior (Storage Slots), a Rust-based Relayer fetches cryptographic storage proofs (`eth_getProof`), and an On-Chain Verifier (Smart Contract) cryptographically verifies the Merkle proofs to issue a verifiable Credit Soulbound Token (SBT).

**Core Constraints (from Socratic Gate):**

1. **User Binding:** The Rust Relayer/Smart Contract strictly enforces that `msg.sender` matches the owner of the verified storage slot to prevent Oracle manipulation.
2. **AI Fallback:** If the LLM hallucinates or fails to return a valid JSON storage slot, the system will explicitly **retry the prompt** rather than falling back to deterministic off-chain indexing. We want real AI extraction.
3. **True Verification:** No mocking the math boundary. The Smart Contract will implement or utilize real Merkle Patricia Trie verification for the `eth_getProof` payload.

## Project Type

**BACKEND** (with Smart Contract & AI integration components)

## Success Criteria

1. The Bun backend successfully fetches raw transaction history and the LLM extracts accurate storage slots.
2. The Rust Relayer successfully queries `eth_getProof` for the exact block numbers and storage slots extracted by the AI, returning valid Merkle proofs.
3. The Polygon/Aptos Smart Contract successfully verifies the Merkle Proof on-chain.
4. The system validates that `msg.sender` owns the storage slot in question.

## Tech Stack

- **AI/API Server:** Bun + Hono/Express (Ultra-fast data fetching and LLM orchestration)
- **AI Model:** OpenAI/Claude via API (Prompt engineering for JSON payload extraction)
- **Relayer:** Rust (`ethers-rs` or `alloy`) for high-performance RPC querying and proof formatting
- **Smart Contracts:** Solidity (Polygon) or Move (Aptos)
- **Blockchain Data:** Alchemy or Infura RPC

## File Structure

```
./
├── backend/                  # Bun AI Backend
│   ├── src/
│   │   ├── index.ts          # Server entry
│   │   ├── llm.ts            # LLM Prompting & Retries
│   │   └── rpc.ts            # Transaction history fetching
│   ├── package.json
│   └── bun.lockb
├── relayer/                  # Rust Proof Engine
│   ├── src/
│   │   ├── main.rs           # Relayer entry
│   │   ├── proof.rs          # eth_getProof handling
│   │   └── server.rs         # Listening for Bun payloads
│   └── Cargo.toml
└── contracts/                # Smart Contracts
    ├── src/
    │   ├── Verifier.sol      # Merkle Proof Verification Logic
    │   └── CreditSBT.sol     # Token Minting
    └── foundry.toml          # Foundry config
```

## Task Breakdown

### 1. Initialize Project & Architect Foundations

- **Agent:** `project-planner` & `backend-specialist`
- **Skills:** `app-builder`, `bash-linux`
- **Dependencies:** None
- **INPUT \u2192 OUTPUT \u2192 VERIFY:** Empty Workspace \u2192 Folders created & dependencies initialized \u2192 `bun install` and `cargo check` pass.

### 2. Bun AI Backend: Transaction Fetching & LLM Extraction

- **Agent:** `backend-specialist`
- **Skills:** `nodejs-best-practices`, `api-patterns`
- **Dependencies:** Task 1
- **INPUT \u2192 OUTPUT \u2192 VERIFY:** Wallet Address \u2192 JSON payload of `{ blockNumber, storageSlot }` \u2192 API returns properly formatted JSON and retries on failure.

### 3. Rust Relayer: Proof Fetching

- **Agent:** `backend-specialist` (Rust/Systems focus)
- **Skills:** `rust-pro`, `api-patterns`
- **Dependencies:** Task 1
- **INPUT \u2192 OUTPUT \u2192 VERIFY:** JSON payload from Bun \u2192 Raw Merkle Proof payload from RPC \u2192 `cargo test` confirms proof formatting works for a known block.

### 4. Smart Contract: Merkle Verification & User Binding

- **Agent:** `security-auditor` & `backend-specialist` (Solidity focus)
- **Skills:** `database-design` (state/storage), `clean-code`
- **Dependencies:** Task 3
- **INPUT \u2192 OUTPUT \u2192 VERIFY:** Merkle Proof Payload \u2192 On-chain Verification & SBT Minting \u2192 Foundry unit tests (`forge test`) pass for valid proofs and revert for invalid/unowned proofs.

### 5. Integration: Bun \u2192 Rust \u2192 Contract

- **Agent:** `test-engineer`, `devops-engineer`
- **Skills:** `webapp-testing`
- **Dependencies:** Tasks 2, 3, 4
- **INPUT \u2192 OUTPUT \u2192 VERIFY:** Connected Wallet \u2192 Minted SBT \u2192 End-to-end integration test passes.

## ✅ Phase X: Verification

- [ ] Security Scan: `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] Code Lint & Types: `bun x tsc --noEmit` & `cargo clippy`
- [ ] Smart Contract Tests: `forge test` passes with 100% coverage on verifier.
- [ ] Integration E2E: Local testnet (Anvil) successfully mints an SBT from an AI-extracted transaction.
