import { extractProofData } from "./llm.js";
import { createPublicClient, http } from 'viem';
import { bsc } from 'viem/chains';

const client = createPublicClient({
  chain: bsc,
  transport: http('https://bsc-dataseed.binance.org/')
});

async function runRealDataTest() {
    console.log("Connecting to Binance Smart Chain via Public RPC...");

    try {
        const blockNumber = await client.getBlockNumber();
        console.log(`Fetching Live Block ${blockNumber}...`);

        const block = await client.getBlock({ blockNumber, includeTransactions: true });

        console.log(`Successfully fetched Block ${block.number}. It contains ${block.transactions.length} transactions.`);
        console.log("Selecting 10 random raw transactions to feed to the AI...");

        const structuredTxs = block.transactions.slice(0, 10).map(tx => {
            if (typeof tx === 'string') return tx;
            return {
                hash: tx.hash,
                blockNumber: tx.blockNumber?.toString(),
                from: tx.from,
                to: tx.to,
                value: tx.value?.toString(),
                // ONLY INCLUDE THE 4-BYTE FUNCTION SELECTOR (first 10 chars: 0x + 8 hex chars)
                // This prevents massive token limits on Groq from huge calldata payloads!
                input_selector: tx.input ? tx.input.substring(0, 10) : "0x",
            };
        });

        const targetAddress = (block.transactions[5] as any).from;
        console.log(`\nAnalyzing Financial Reliability Score for Random BSC User: ${targetAddress}\n`);

        const aiResult = await extractProofData(targetAddress, structuredTxs);

        console.log("✅ AI Analysis Complete! Real Data Result on Live BSC Tx's:");
        console.log(JSON.stringify(aiResult, null, 2));

    } catch (error) {
        console.error("Error during real data test:", error);
    }
}

runRealDataTest();
