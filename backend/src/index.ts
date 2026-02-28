import { serve } from "bun";
import { Hono } from "hono";
import OpenAI from "openai";

const app = new Hono();
const openai = new OpenAI();

app.get("/", (c) => c.text("BlockVault AI Oracle Running"));

app.post("/analyze", async (c) => {
  try {
    const { address, transactions } = await c.req.json();

    // Simulate LLM Call - with retry logic built-in to handle hallucinated hex
    const prompt = `Analyze these transactions for wallet ${address}. Find exactly 1 transaction indicating positive financial health (e.g., successful loan repayment). Return ONLY a JSON object with strictly: { "blockNumber": "0x...", "storageSlot": "0x..." }. Do NOT return markdown or explanation.`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt + JSON.stringify(transactions) }],
        response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const extractedData = JSON.parse(content || "{}");

    if (!extractedData.blockNumber || !extractedData.storageSlot) {
        throw new Error("LLM failed to extract blockumber or storageSlot");
    }

    // In production, we'd send this to the Rust Relayer
    return c.json({ success: true, data: extractedData });

  } catch (error) {
     return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

console.log("Bun server running on http://localhost:3000");
export default {
    port: 3000,
    fetch: app.fetch,
};
