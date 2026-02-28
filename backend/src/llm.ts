import { GoogleGenAI } from "@google/genai";
import { Groq } from "groq-sdk";

// Initialize AI Providers
const ai = new GoogleGenAI({ apiKey: "AIzaSyD9TioL1ec77u6j47q-O2gNEvIi14Sm2Fw" });
const groq = new Groq({ apiKey: "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" });

const PROMPT_TEMPLATE = `
You are a Chain-Agnostic Web3 Risk Analyst for an under-collateralized lending protocol.
I will provide you with a raw array of transactions for a specific wallet address (either EVM or Algorand).

Your job is to analyze their ENTIRE history and calculate a "BlockVault Financial Reliability Score" (0 to 1000).

Scoring Rules:
1. Base Score: Start at 500.
2. Liquidations (-500): If the user was ever liquidated on Aave, Compound, Maker, AlgoFi, Folks Finance, etc., subtract 500. This is severe.
3. Repayments (+300): If the user successfully repaid a DeFi loan, add 300.
4. Consistent Yield (+100): If the user provided liquidity (LPing) or supplied assets for a long time, add 100.
5. Wallet Age/Activity (+50): If the wallet has sustained activity over months, add 50.

Once you calculate the score, find EXACTLY ONE transaction that best demonstrates their positive financial reliability.
For EVM, this will be used for a ZK-SNARK Merkle Storage Proof.
For Algorand, this will be used for an Algorand State Proof.

Return ONLY a strict JSON payload. Do NOT include markdown blocks (\`\`\`json). Do NOT include any explanations.

The JSON MUST have this exact structure:
{
  "reliabilityScore": 850,
  "riskLevel": "Low",
  "proofTargetBlock": "0x123abc... (OR Algorand Round Integer as string)",
  "proofStorageSlot": "0x0000... (OR Algorand Transaction ID / App ID)",
  "totalRepays": 5,
  "liquidations": 0,
  "reasoningSummary": "User repaid a 500 USDC loan on Aave and has no history of liquidations."
}

Address: {ADDRESS}
Transactions:
{TRANSACTIONS}
`;

export async function extractProofData(address: string, transactions: any[], retries = 3): Promise<{reliabilityScore: number, riskLevel: string, proofTargetBlock: string, proofStorageSlot: string, reasoningSummary: string}> {
    const prompt = PROMPT_TEMPLATE
        .replace("{ADDRESS}", address)
        .replace("{TRANSACTIONS}", JSON.stringify(transactions, null, 2));

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[Gemini] Extraction Attempt ${attempt}/${retries}...`);

            // Primary: Gemini
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            const content = response.text;
            if (!content) throw new Error("Empty response from Gemini");

            const parsed = JSON.parse(content);

            // Validate format (relaxed for Algorand non-hex strings)
            if (!parsed.proofTargetBlock || !parsed.proofStorageSlot || typeof parsed.reliabilityScore !== 'number' || typeof parsed.totalRepays !== 'number' || typeof parsed.liquidations !== 'number') {
                throw new Error("Returned values are missing or invalid format. Must include totalRepays and liquidations.");
            }

            return parsed;
        } catch (error) {
            console.error(`[Gemini] Attempt ${attempt} failed: ${(error as Error).message}. Falling back to Groq...`);

            // Fallback: Groq (Llama 3 or Mixtral)
            try {
                 const groqResponse = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.3-70b-versatile",
                    response_format: { type: "json_object" }
                 });

                 const groqContent = groqResponse.choices[0]?.message?.content;
                 if (!groqContent) throw new Error("Empty response from Groq");

                  const parsed = JSON.parse(groqContent);
                  if (!parsed.proofTargetBlock || !parsed.proofStorageSlot || typeof parsed.reliabilityScore !== 'number' || typeof parsed.totalRepays !== 'number' || typeof parsed.liquidations !== 'number') {
                      throw new Error("Returned values are missing or invalid format. Must include totalRepays and liquidations.");
                  }

                  console.log("[Groq] Fallback successful!");
                  return parsed;

            } catch (groqError) {
                console.error(`[Groq] Fallback failed: ${(groqError as Error).message}`);

                if (attempt === retries) {
                    throw new Error("Failed to extract valid proof data after maximum retries on both Gemini and Groq.");
                }
                // Optional: Add a slight delay before retry loop continues
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    throw new Error("Unreachable");
}
