import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import axios from "axios";

// 1. Initialize AI Providers
const genAI = new GoogleGenerativeAI("AIzaSyD9TioL1ec77u6j47q-O2gNEvIi14Sm2Fw");
const ai = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const groq = new Groq({ apiKey: "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" });

// 2. The Detailed Extraction Prompt
const ORCHESTRATOR_PROMPT = `
You are a Chain-Agnostic Web3 Risk Analyst for an under-collateralized lending protocol.
I am providing you with a raw array of transactions for a specific wallet address.

Your job is to act as the "Universal Orchestrator". You must:
1. Filter out all irrelevant or "normal" transactions (like a simple token transfer to a random wallet).
2. Identify ONLY the legitimate "Protocol Transactions" (DeFi interactions, Loan Repayments, Liquidations, Staking).
3. Calculate their "BlockVault Financial Reliability Score" (0 to 1000). Base score is 500. Repays = +300. Liquidations = -500.

Return ONLY a strict JSON payload. Do NOT include markdown blocks (\`\`\`json). Do NOT include any explanations.

The JSON MUST have this EXACT structure:
{
  "reliabilityScore": 850,
  "totalRepays": 5,
  "liquidations": 0,
  "legitimateTransactions": [
    {
      "transactionHash": "0x123abc...",
      "protocol": "Aave",
      "action": "Loan Repayment",
      "impact": "+300"
    }
  ],
  "sbtUpdateMetadata": {
    "scoreToMint": 850,
    "repaysToAdd": 5,
    "liquidationsToAdd": 0,
    "summaryLogs": "User repaid 5 loans and had 0 liquidations over 20 transactions."
  }
}
`;

// 3. The Extraction Logic
export async function runSbtOrchestrator(targetAddress: string, transactions: any[]) {
    try {
        console.log(`\n[Orchestrator] Sending ${transactions.length} raw transactions to the AI for refinement...\n`);

        const payload = JSON.stringify(transactions);

        let content: string | null = null;
        try {
            const response = await ai.generateContent(
                `${ORCHESTRATOR_PROMPT}\n\nTRANSACTION HISTORY FOR ${targetAddress}:\n${payload}`
            );
            content = response.response.text() || null;
        } catch (e: any) {
            console.log(`[Gemini] Failed, falling back to Groq: ${e.message}`);
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: `${ORCHESTRATOR_PROMPT}\n\nTRANSACTIONS:\n${payload}` }],
                model: "llama-3.3-70b-versatile",
            });
            content = completion.choices[0]?.message?.content || null;
        }

        if (!content) throw new Error("AI returned empty content");

        // Clean markdown backticks if AI accidentally included them
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(content);
        return parsed;

    } catch (error) {
        console.error("Orchestrator failed:", error);
        throw error;
    }
}

// 4. Test Script to Simulate the Minter Flow
async function testOrchestrator() {
    const ALGO_INDEXER = "https://mainnet-idx.algonode.cloud/v2";
    console.log("=== BLOCKVAULT SBT SUPER-ORCHESTRATOR ===");
    console.log("Fetching a live User from Algorand to demonstrate the filtration log...");

    try {
        const latestAppTxsRes = await axios.get(`${ALGO_INDEXER}/transactions?limit=25`);
        const targetAddress = latestAppTxsRes.data.transactions[0].sender;

        console.log(`Target User: ${targetAddress}`);
        const userHistoryRes = await axios.get(`${ALGO_INDEXER}/accounts/${targetAddress}/transactions?limit=20`);
        const rawTxs = userHistoryRes.data.transactions || [];

        // Truncate data to prevent massive rate limits
        const structuredTxs = rawTxs.map((tx: any) => ({
            id: tx.id,
            type: tx['tx-type'],
            appId: tx['application-transaction'] ? tx['application-transaction']['application-id'] : undefined
        }));

        const finalSbtPayload = await runSbtOrchestrator(targetAddress, structuredTxs);

        console.log("\n=======================================================");
        console.log("✅ JUDGE'S RECEIPT: AI TRANSACTION FILTRATION RECORD");
        console.log("=======================================================\n");
        console.log(JSON.stringify(finalSbtPayload, null, 2));

        console.log(`\n🔥 ACTION: Smart Contract \`updateScore(${targetAddress}, ${finalSbtPayload.sbtUpdateMetadata.scoreToMint}, ${finalSbtPayload.sbtUpdateMetadata.repaysToAdd}, ${finalSbtPayload.sbtUpdateMetadata.liquidationsToAdd})\` is ready to execute!`);

    } catch (e) {
        console.error("Error running test:", e);
    }
}

// Execute the simulation
testOrchestrator();
