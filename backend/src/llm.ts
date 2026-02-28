import { GoogleGenAI } from "@google/genai";
import { Groq } from "groq-sdk";

// Initialize AI Providers
const ai = new GoogleGenAI({ apiKey: "AIzaSyCBGFnfvyNluELE-qi4_p-6-jpVMKJmXHc" });
const groq = new Groq({ apiKey: "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" });

const PROMPT_TEMPLATE = `
You are a Web3 Risk Analyst for an under-collateralized lending protocol.
I will provide you with a raw array of Ethereum transactions for a specific wallet address.

Your job is to find EXACTLY ONE transaction that demonstrates positive financial behavior.
Positive behavior includes:
1. Depositing collateral into Aave, Compound, or Maker.
2. Repaying a DeFi loan.
3. Consistently swapping high volumes on DEXes (Uniswap/Curve) without liquidation.

You must return ONLY a strict JSON payload. Do NOT include markdown blocks (\`\`\`json). Do NOT include any explanations.

The JSON MUST have this exact structure:
{
  "blockNumber": "0x123abc...",
  "storageSlot": "0x0000..."
}

Address: {ADDRESS}
Transactions:
{TRANSACTIONS}
`;

export async function extractProofData(address: string, transactions: any[], retries = 3): Promise<{blockNumber: string, storageSlot: string}> {
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

            // Validate hex format
            if (!parsed.blockNumber?.startsWith("0x") || !parsed.storageSlot?.startsWith("0x")) {
                throw new Error("Returned values are not valid Hex strings");
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
                  if (!parsed.blockNumber?.startsWith("0x") || !parsed.storageSlot?.startsWith("0x")) {
                      throw new Error("Returned values are not valid Hex strings");
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
