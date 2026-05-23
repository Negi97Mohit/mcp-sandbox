import { CONFIG } from "../config/env.js";
import { allTools } from "../tools/index.js";

// ─── Free-model fallback chain ───────────────────────────────────────────────
// When the primary model hits its daily limit we automatically retry with the
// next model in the list.  All models are free-tier on OpenRouter.
const FREE_MODEL_FALLBACK_CHAIN: string[] = [
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-3-1b-it:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen3-0.6b:free",
    "microsoft/phi-3-mini-128k-instruct:free",
];

// Track which models are currently rate-limited and when they reset
const modelRateLimits: Map<string, number> = new Map(); // model -> resetMs

export interface RateLimitError extends Error {
    isRateLimit: true;
    resetAt: Date | null;
    allModelsExhausted: boolean;
}

// Regex to parse tool calls like [tool_name(arg="value")] OR tool_name(arg="value")
// We make the outer brackets optional in a smarter way or handle it in the parser loop
const TOOL_CALL_REGEX = /(?:\[)?(\w+)\(([^)]*)\)(?:\])?/g;

// Helper to strip code blocks (```python ... ```)
function stripCodeBlocks(text: string): string {
    return text.replace(/```[\w]*\n([\s\S]*?)\n```/g, '$1').trim();
}

function parseToolCallsFromText(text: string): any[] | null {
    // 1. Clean the text (remove code blocks if they wrap the whole thing)
    const cleanText = stripCodeBlocks(text);

    // 2. Scan for [toolName( ... )] blocks with balanced parentheses
    const calls: any[] = [];
    let currentIndex = 0;

    while (currentIndex < cleanText.length) {
        // Find start of a tool call: matches [toolname( or just toolname(
        const startMatch = cleanText.substring(currentIndex).match(/(?:\[)?(\w+)\(/);
        if (!startMatch || startMatch.index === undefined) break; // No more calls

        const toolName = startMatch[1];
        const startIndex = currentIndex + startMatch.index;
        const argsStartIndex = startIndex + startMatch[0].length; // Position after '('

        // Find balanced ending ')'
        let balance = 1;
        let pIndex = argsStartIndex;
        let inQuote = false;
        let quoteChar = '';
        let escape = false;

        while (pIndex < cleanText.length && balance > 0) {
            const char = cleanText[pIndex];

            if (escape) {
                escape = false;
            } else if (char === '\\') {
                escape = true;
            } else if (inQuote) {
                if (char === quoteChar) inQuote = false;
            } else {
                if (char === '"' || char === "'") {
                    inQuote = true;
                    quoteChar = char;
                } else if (char === '(') {
                    balance++;
                } else if (char === ')') {
                    balance--;
                }
            }
            pIndex++;
        }

        if (balance === 0) {
            // Found a valid block
            const argsString = cleanText.substring(argsStartIndex, pIndex - 1); // Content inside parens

            // Helper to extract key-value pairs handling mixed quotes and newlines
            const args: Record<string, string> = {};
            // Match key="value" or key='value' 
            const argRegex = /(\w+)\s*=\s*(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)')/g;

            let regexMatch;
            while ((regexMatch = argRegex.exec(argsString)) !== null) {
                const key = regexMatch[1];
                let value: string = (regexMatch[2] !== undefined ? regexMatch[2] : regexMatch[3]) || "";

                if (key && value !== undefined) {
                    try {
                        if (regexMatch[2] !== undefined) {
                            value = JSON.parse(`"${value}"`);
                        } else {
                            value = value.replace(/\\'/g, "'").replace(/\\\\/g, "\\").replace(/\\n/g, "\n");
                        }
                    } catch (e) {
                        value = value.replace(/\\\\/g, "\\").replace(/\\n/g, "\n").replace(/\\"/g, '"');
                    }
                    args[key] = value;
                }
            }

            calls.push({
                id: `parsed_${calls.length}_${Date.now()}`,
                type: "function",
                function: {
                    name: toolName,
                    arguments: JSON.stringify(args),
                },
            });

            currentIndex = pIndex; // Move past this block
        } else {
            // Malformed or incomplete, skip forward
            currentIndex = startIndex + 1;
        }
    }

    return calls.length > 0 ? calls : null;
}

/**
 * Build an ordered list of models to try: primary config model first,
 * then the fallback chain (skipping already rate-limited models).
 */
function buildModelList(): string[] {
    const primary = CONFIG.MODEL_NAME;
    const now = Date.now();

    // Remove expired rate-limits
    for (const [model, resetMs] of modelRateLimits.entries()) {
        if (now >= resetMs) modelRateLimits.delete(model);
    }

    const chain = [primary, ...FREE_MODEL_FALLBACK_CHAIN.filter(m => m !== primary)];
    // Put non-limited models first, exhausted ones at the end (as last resort attempts)
    return [
        ...chain.filter(m => !modelRateLimits.has(m)),
        ...chain.filter(m => modelRateLimits.has(m)),
    ];
}

/**
 * Call OpenRouter with automatic free-model fallback on 429 rate-limit errors.
 *
 * If ALL models are exhausted a RateLimitError is thrown with `allModelsExhausted: true`
 * and a `resetAt` timestamp so callers can show a meaningful message.
 */
export async function callOpenRouter(messages: any[]): Promise<any> {
    const modelsToTry = buildModelList();
    let lastError: Error | null = null;
    let earliestReset: Date | null = null;

    for (const model of modelsToTry) {
        try {
            const message = await callOpenRouterWithModel(messages, model);
            // If we used a fallback, log it
            if (model !== CONFIG.MODEL_NAME) {
                console.log(`🔄 Used fallback model: ${model}`);
            }
            return message;
        } catch (err: any) {
            lastError = err;

            // Parse 429 metadata to track reset time
            if (err.statusCode === 429 || err.message?.includes("Rate limit exceeded") || err.message?.includes("429")) {
                
                // ─── ACCOUNT-LEVEL limit (free-models-per-day) ───────────────
                // This caps ALL free models combined. Fallbacks won't help.
                if (err.message?.includes("free-models-per-day")) {
                    console.warn("🚫 Account-level free-models-per-day limit hit. Fallbacks won't help.");
                    const resetMs = err.resetMs ?? (Date.now() + 3600_000);
                    const rlErr = new Error(
                        "Your OpenRouter account has exhausted its daily free model quota (50 requests/day). " +
                        "Add $10 in credits at https://openrouter.ai to unlock 1,000 free requests/day, " +
                        "or set MODEL_NAME in your .env to a paid model."
                    ) as RateLimitError;
                    rlErr.isRateLimit = true;
                    rlErr.resetAt = new Date(resetMs);
                    rlErr.allModelsExhausted = true;
                    throw rlErr;
                }

                // ─── Per-model limit — try next fallback ─────────────────────
                const resetMs = err.resetMs ?? null;
                if (resetMs) {
                    modelRateLimits.set(model, resetMs);
                    const resetDate = new Date(resetMs);
                    if (!earliestReset || resetDate < earliestReset) {
                        earliestReset = resetDate;
                    }
                } else {
                    // Default: mark as limited for 1 hour
                    const fallbackReset = Date.now() + 3600_000;
                    modelRateLimits.set(model, fallbackReset);
                    const resetDate = new Date(fallbackReset);
                    if (!earliestReset || resetDate < earliestReset) {
                        earliestReset = resetDate;
                    }
                }
                console.warn(`⚠️ Model ${model} rate limited. Trying next fallback...`);
                continue; // Try next model
            }

            // For non-rate-limit errors, throw immediately
            throw err;
        }
    }

    // All models exhausted — throw a descriptive RateLimitError
    const rlErr = new Error("All free models are rate-limited. Please wait or add credits.") as RateLimitError;
    rlErr.isRateLimit = true;
    rlErr.resetAt = earliestReset;
    rlErr.allModelsExhausted = true;
    throw rlErr;
}

/**
 * Raw single-model call. Throws with statusCode + resetMs attached on 429.
 */
async function callOpenRouterWithModel(messages: any[], model: string): Promise<any> {
    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://discord-agent.com",
                "X-Title": "DevOps Agent",
            },
            body: JSON.stringify({
                model,
                messages: messages,
                tools: allTools,
                tool_choice: "auto",
            }),
        },
    );

    if (!response.ok) {
        const errorBody = await response.text();
        const err: any = new Error(`OpenRouter API Error: ${response.statusText} - ${errorBody}`);
        err.statusCode = response.status;

        // Extract rate-limit reset header if present
        const resetHeader = response.headers.get("X-RateLimit-Reset");
        if (resetHeader) {
            err.resetMs = parseInt(resetHeader, 10);
        } else {
            // Try parsing from JSON body
            try {
                const parsed = JSON.parse(errorBody);
                const resetStr = parsed?.error?.metadata?.headers?.["X-RateLimit-Reset"];
                if (resetStr) err.resetMs = parseInt(resetStr, 10);
            } catch {
                // ignore
            }
        }

        throw err;
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
        console.error("OpenRouter API unexpected response:", JSON.stringify(data, null, 2));
        throw new Error("OpenRouter API returned no choices.");
    }

    const message = data.choices[0].message;

    // Debug: Log what we got
    console.log("📡 API Response:", JSON.stringify({
        model,
        content: message.content?.substring(0, 100),
        tool_calls: message.tool_calls,
        hasToolCalls: !!message.tool_calls,
    }, null, 2));

    // If no native tool_calls but content looks like a tool call, parse it
    if (!message.tool_calls && message.content) {
        let parsedCalls = null;

        // 1. Try parsing valid JSON first (User reported specific JSON format issues)
        const contentTrimmed = message.content.trim();
        if (contentTrimmed.startsWith("[") && contentTrimmed.endsWith("]")) {
            try {
                const potentialJson = JSON.parse(contentTrimmed);
                if (Array.isArray(potentialJson) && potentialJson.length > 0) {
                    // Verify structure
                    const isValid = potentialJson.every((call: any) =>
                        call.type === "function" &&
                        call.function &&
                        typeof call.function.name === "string" &&
                        (typeof call.function.arguments === "string" || typeof call.function.arguments === "object")
                    );

                    if (isValid) {
                        parsedCalls = potentialJson.map((call: any) => ({
                            ...call,
                            id: call.id || `json_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            function: {
                                ...call.function,
                                // Ensure arguments are stringified if they came as objects
                                arguments: typeof call.function.arguments === "object"
                                    ? JSON.stringify(call.function.arguments)
                                    : call.function.arguments
                            }
                        }));
                    }
                }
            } catch (e) {
                // Not valid JSON, ignore
            }
        }

        // 2. If not JSON, try the custom text format
        if (!parsedCalls) {
            parsedCalls = parseToolCallsFromText(message.content);
        }

        if (parsedCalls && parsedCalls.length > 0) {
            console.log("🔧 Parsed tool calls from text/json:", JSON.stringify(parsedCalls));
            message.tool_calls = parsedCalls;
            message.content = null; // Clear content since we're treating it as a tool call
        }
    }

    return message;
}
