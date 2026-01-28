import { CONFIG } from "../config/env.js";
import { allTools } from "../tools/index.js";

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

export async function callOpenRouter(messages: any[]) {
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
                model: CONFIG.MODEL_NAME,
                messages: messages,
                tools: allTools,
                tool_choice: "auto",
            }),
        },
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API Error: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
        console.error("OpenRouter API unexpected response:", JSON.stringify(data, null, 2));
        throw new Error("OpenRouter API returned no choices.");
    }

    const message = data.choices[0].message;

    // Debug: Log what we got
    console.log("📡 API Response:", JSON.stringify({
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
