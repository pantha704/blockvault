# BlockVault: Decentralized Credit Scoring Powered by AI and Storage Proofs

BlockVault is a trustless, on-chain credit scoring system designed to solve the "amnesia" problem of smart contracts. It bridges Generative AI with Web3 cryptography to offer under-collateralized loans and verify positive financial history without relying on centralized credit bureaus.

## 🎯 The Problem

Smart contracts have "amnesia." They can only perceive the current state of the blockchain. If a user wants to prove they have a flawless history of repaying loans, surviving market crashes without being liquidated, or maintaining consistent high-volume trades—a standard smart contract cannot verify that without trusting a centralized off-chain entity (like a traditional credit bureau) or a trusted oracle.

On EVM chains, smart contracts are limited by the `BLOCKHASH` opcode, which only has access to the last 256 blocks (~10-15 minutes of history). Trustlessly verifying anything that happened months or years ago requires complex cryptographic workarounds.

## 💡 The Solution

BlockVault introduces a novel architecture that uses **Generative AI to index and extract relevant financial history**, and **Rust-based relayers to provide cryptographic Merkle storage proofs**.

This allows lending protocols to issue verifiable "Credit Soulbound Tokens" (SBTs) that unlock under-collateralized loans for trustworthy users. By generating a mathematical proof of past events, BlockVault completely eliminates the need for trusted third-party oracles to verify a user's financial history.

### The BlockVault Flow: How we solve Smart Contract Amnesia

```text
  ┌─────────────────┐       (1) Raw TX History        ┌──────────────────┐
  │                 ├────────────────────────────────►│                  │
  │   User Wallet   │                                 │   AI Risk Agent  │
  │                 │◄────────────────────────────────┤  (Bun + Gemini)  │
  └────────┬────────┘   (2) Extracts specific Block   └─────────┬────────┘
           │                & Storage Slot as JSON              │
           │                                                    │
           │ (5) Submits                 (3) Sends JSON Payload │
           │ Cryptographic Proof                                │
           │                                                    ▼
  ┌────────▼────────┐                         ┌─────────────────┴──┐
  │                 │                         │                    │
  │ Verifier Smart  │                         │    Rust Relayer    │
  │ Contract (EVM)  │◄────────────────────────┤   (ethers-rs)      │
  │                 │    (4) Queries Archive  │                    │
  └────────┬────────┘        Node for MPT     └────────────────────┘
           │                 Storage Proof
           │
           │ (6) Mints Credit SBT
           ▼
  ┌─────────────────┐
  │                 │
  │ Under-Collateral│
  │ DeFi Lending    │
  │                 │
  └─────────────────┘
```

### Architecture Flow

1. **The AI Analyst (Bun + Next.js)**
   - A user connects their wallet to the dashboard.
   - The backend fetches the user's raw, unstructured transaction history using an RPC provider or indexer (like Alchemy).
   - **The AI Magic:** This raw data is fed into an LLM (e.g., GPT-4o). The AI acts as a sophisticated risk analyst, scanning for positive financial behavior (like repaying a DeFi loan or depositing collateral). The LLM deterministically extracts the exact **Block Number** and **Storage Slot** associated with that behavior, returning a strict JSON payload.

2. **The Proof Engine (Rust Relayer)**
   - A high-performance Rust service listens for the JSON payload from the AI backend.
   - It connects to an archive node and calls `eth_getProof` for the specific block number and storage slot.
   - It retrieves the raw Ethereum state (the Merkle Patricia Trie paths) and formats the Merkle proofs into a cryptographic payload.

3. **The On-Chain Verifier (Solidity / Move)**
   - The Rust relayer submits the proof payload to the BlockVault Smart Contract (deployed on Polygon or Aptos).
   - The contract verifies the Merkle proof mathematically.
   - **Critical Security:** The contract inherently checks that the proven storage slot is cryptographically bound to `msg.sender` to prevent Oracle manipulation.
   - If verified, the contract mints a Verifiable Credit Soulbound Token (SBT) representing the user's on-chain creditworthiness.

4. **The Lending Protocol Integration**
   - A mock Lending Protocol integrates with BlockVault.
   - A new user requires a high collateral ratio (e.g., 150% collateral to borrow 100 USDC).
   - A BlockVault-verified user (holding the Credit SBT) qualifies for an under-collateralized loan (e.g., only 110% collateral to borrow 100 USDC).

## 🏆 Hackathon Tracks & Strategy (Diversion 2K26)

This project is meticulously engineered to sweep multiple tracks by fusing complex soft-tech with hard-tech:

- **Diversion Best AI:** Utilizes LLMs not as a chatbot, but as a deterministic state-extraction infrastructure component.
- **Polygon / Aptos Integration:** Natively deployed verification logic and token lifecycle on specific L1/L2 ecosystems.
- **DeFi Innovation:** Directly tackles the holy grail of DeFi—under-collateralized lending.

## 🛠️ Tech Stack

- **Backend / API:** Bun, Hono, viem
- **AI Provider:** OpenAI (GPT-4o) / Anthropic Claude
- **Relayer:** Rust, Axum, ethers-rs, tokio
- **Smart Contracts:** Solidity (Foundry) or Move

## 📁 Repository Structure

```text
blockvault/
├── backend/            # Bun + Hono API Server (AI Integration & Data Fetching)
│   ├── src/
│   │   ├── index.ts    # Main server entrypoint
│   │   ├── llm.ts      # LLM Prompting, Parsing, and Retry Logic
│   │   └── rpc.ts      # Blockchain history indexer/RPC logic
├── relayer/            # Rust Axum API Server (Cryptography & Proof Fetching)
│   ├── src/
│   │   ├── main.rs     # Relayer entrypoint
│   │   └── proof.rs    # ethers-rs `eth_getProof` execution
├── contracts/          # Solidity / Move Smart Contracts
│   ├── src/
│   │   ├── Verifier.sol # Merkle Proof verification and Security Slot binding
└── blockvault.md       # Original execution plan & architecture spec
```

## 🚀 Future Roadmap & Scalability

- **Integration with Storylus:** To circumvent the EVM 256-block limit without a trusted oracle, BlockVault can integrate with optimistic historical state provers like Cometh's Storylus. This would allow the smart contract to trustlessly verify _any_ historical block root on chain.
- **Advanced ZK-Coprocessors:** Upgrading the Rust Relayer to generate a Zero-Knowledge proof (via SP1 or RiscZero) so the smart contract only has to verify a succinct ZK-SNARK instead of a massive MPT path.
