import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// Using a public RPC for hackathon purposes. Replace with Alchemy/Infura before deployment.
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

/**
 * Fetches recent transactions for a given address.
 * In a real scenario, you'd use an Indexer API (Alchemy, Etherscan)
 * since pure RPC doesn't support generic address lookups easily without parsing blocks.
 */
export async function fetchRecentTransactions(address: `0x${string}`) {
    console.log(`Fetching transaction history for ${address}`);
    
    // Mocking an indexer response for the hackathon MVP
    // In reality, this would be: await alchemy.core.getAssetTransfers({fromBlock, toBlock, fromAddress: address})
    return [
        {
            hash: "0x3e1f...",
            blockNumber: "0x12a0234",
            to: "0xAavePool...",
            value: "1000000000000000000",
            method: "repayLoan",
            timestamp: 1709214000
        },
        {
            hash: "0x9c4b...",
            blockNumber: "0x128b9aa",
            to: "0xUniswapRouter...",
            value: "500000000000000000",
            method: "swap",
            timestamp: 1708102000
        }
    ];
}
