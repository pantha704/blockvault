import { extractProofData } from "./llm.js";
import axios from "axios";

// Public Algonode Indexer API for Algorand Mainnet
const ALGO_INDEXER = "https://mainnet-idx.algonode.cloud/v2";

async function runRealAlgorandDataTest() {
    console.log("Connecting to Algorand Mainnet via Public Algonode Indexer...");

    try {
        // Step 1: Find a random live user who just transacted
        console.log("Finding a random active Algorand user...");
        const latestAppTxsRes = await axios.get(`${ALGO_INDEXER}/transactions?limit=25`);

        if (!latestAppTxsRes.data || !latestAppTxsRes.data.transactions || latestAppTxsRes.data.transactions.length === 0) {
            throw new Error("Failed to fetch Algorand latest transactions.");
        }

        const targetAddress = latestAppTxsRes.data.transactions[0].sender;
        console.log(`\nAnalyzing Financial Reliability Score for Random Algorand User: ${targetAddress}\n`);

        // Step 2: Fetch that specific user's last 20 transactions
        console.log(`Fetching recent live history for ${targetAddress}...`);
        const userHistoryRes = await axios.get(`${ALGO_INDEXER}/accounts/${targetAddress}/transactions?limit=20`);
        const rawTransactions = userHistoryRes.data.transactions || [];

        console.log(`Successfully fetched ${rawTransactions.length} recent transactions.`);
        console.log("Extracting relevant fields to feed to the AI...");

        // Format to a generic structure for the AI
        const structuredTxs = rawTransactions.map((tx: any) => {
            let details: any = {};

            // Extract the App ID or standard payment info
            if (tx['tx-type'] === 'appl' && tx['application-transaction']) {
                details.appId = tx['application-transaction']['application-id'];
                // Algorand smart contract args are base64 encoded strings
                const args = tx['application-transaction']['application-args'];
                details.appArgs = args ? args : "No Args";
            } else if (tx['tx-type'] === 'pay' && tx['payment-transaction']) {
                details.amountMicroAlgos = tx['payment-transaction'].amount;
            }

            return {
                id: tx.id,
                round: tx['confirmed-round'],
                sender: tx.sender,
                type: tx['tx-type'],
                details: details
            };
        });

        console.log("Passing RAW Algorand Application logs and Payment data to Gemini AI...\n");

        const aiResult = await extractProofData(targetAddress, structuredTxs);

        console.log("✅ AI Analysis Complete! Real Data Result on Live Algorand Tx's:");
        console.log(JSON.stringify(aiResult, null, 2));

        console.log(`\nVerify this round and transaction on AlgoExplorer!`);
        console.log(`https://allo.info/tx/${aiResult.proofStorageSlot || aiResult.proofTargetBlock}`);

    } catch (error) {
        console.error("Error during Algorand real data test:", error);
    }
}

runRealAlgorandDataTest();
