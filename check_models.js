import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
];
async function check() {
    console.log("🔍 Testing models for your API Key...");
    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName.padEnd(25)} `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            await model.generateContent("Hello");
            console.log("✅ WORKS!");
        }
        catch (e) {
            if (e.message.includes("404"))
                console.log("❌ Not Found");
            else if (e.message.includes("429"))
                console.log("⚠️ Quota Full (But exists)");
            else
                console.log(`❌ Error: ${e.statusText || e.message.split("\n")[0]}`);
        }
    }
}
check();
//# sourceMappingURL=check_models.js.map