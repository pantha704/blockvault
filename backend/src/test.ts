import { extractProofData } from "./llm";

async function main() {
    console.log("Starting BlockVault AI Extractor Test...\n");
    
    const mockAddress = "0x123abc456def78901234567890abcdef12345678";
    const mockTransactions = [
        {
            "hash": "0x1111...",
            "blockNumber": "0x12a0230",
            "to": "0xRandomToken...",
            "value": "100",
            "method": "transfer",
            "timestamp": 1709210000
        },
        {
            "hash": "0x2222...",
            "blockNumber": "0x12a0234",
            "to": "0xAavePool...",
            "value": "5000000000000000000",
            "method": "depositCollateral",
            "timestamp": 1709214000
        },
        {
            "hash": "0x3333...",
            "blockNumber": "0x12a0238",
            "to": "0xRandomToken...",
            "value": "50",
            "method": "transfer",
            "timestamp": 1709218000
        }
    ];

    console.log("Testing with mock transactions:");
    console.log(JSON.stringify(mockTransactions, null, 2));
    console.log("\nThe AI should correctly identify the Aave deposit at block 0x12a0234.\n");

    try {
        const result = await extractProofData(mockAddress, mockTransactions);
        console.log("\n✅ AI Extraction Successful!");
        console.log("Raw Output:", result);
    } catch (error) {
        console.error("\n❌ Test Failed:", (error as Error).message);
    }
}

main().catch(console.error);
