/**
 * Splits a long message into multiple chunks while respecting Discord's length limits and code blocks.
 *
 * @param text The full message text to split.
 * @param maxLength The maximum length of each chunk (default: 2000).
 * @returns An array of message chunks.
 */
export function smartSplitMessage(text, maxLength = 2000) {
    if (text.length <= maxLength)
        return [text];
    const chunks = [];
    let currentChunk = "";
    let openCodeBlock = null;
    const lines = text.split("\n");
    for (const line of lines) {
        // 1. Calculate what the state WOULD be after this line
        let nextOpenCodeBlock = openCodeBlock;
        const backtickMatches = line.match(/```/g);
        if (backtickMatches) {
            for (const _ of backtickMatches) {
                if (nextOpenCodeBlock !== null) {
                    nextOpenCodeBlock = null;
                }
                else {
                    const match = line.match(/```(\w*)/);
                    nextOpenCodeBlock = (match && match[1]) ? match[1] : "";
                }
            }
        }
        const closingOverheadIfAdded = nextOpenCodeBlock !== null ? "\n```" : "";
        const newline = currentChunk.length > 0 ? "\n" : "";
        // Check if we can add this line to current chunk
        const lengthIfAdded = currentChunk.length + newline.length + line.length + closingOverheadIfAdded.length;
        if (lengthIfAdded <= maxLength) {
            // Fits!
            currentChunk += newline + line;
            openCodeBlock = nextOpenCodeBlock;
            continue;
        }
        // Doesn't fit. First, flush current chunk if it has content (beyond just opening tags theoretically, but simplistically if len > 0)
        // Check if `currentChunk` actually contains visible content? 
        // If currentChunk is just opening tags, splitting doesn't help much if the line itself is huge.
        // But let's follow the standard: verify if currentChunk + closing fits? (It should).
        const closingOverheadNow = openCodeBlock !== null ? "\n```" : "";
        // Only push if there's something meaningful or if we need to clear buffer
        if (currentChunk.length + closingOverheadNow.length > 0) {
            // Close it
            if (openCodeBlock !== null)
                currentChunk += closingOverheadNow;
            // If valid chunk (not empty or just a closure of nothing?), push
            // Actually, if we just opened a block and split, we might push ```ts\n\n``` which is empty. 
            // That's acceptable but maybe suboptimal.
            // Ideally we check if text content exists.
            chunks.push(currentChunk);
            currentChunk = "";
        }
        // Now we are starting fresh for `line`.
        // We must reopen the block if we were inside one.
        if (openCodeBlock !== null) {
            currentChunk += `\`\`\`${openCodeBlock}\n`;
        }
        // Does the line fit in a fresh chunk?
        const freshLength = currentChunk.length + line.length + closingOverheadIfAdded.length;
        if (freshLength <= maxLength) {
            currentChunk += line;
            openCodeBlock = nextOpenCodeBlock;
        }
        else {
            // Line is too massive. Hard split.
            let remainingLine = line;
            while (remainingLine.length > 0) {
                // Calculate space available in currentChunk
                // We need to reserve space for closing overhead IF we split here.
                // If we split here, we use `openCodeBlock` (preserved state) to close.
                const closingSpace = openCodeBlock !== null ? 4 : 0; // "\n```" approx 4 chars
                let spaceLeft = maxLength - currentChunk.length - closingSpace;
                if (spaceLeft <= 0) {
                    // This is bad. Overhead took up everything?
                    // Should force at least 1 char or we stick in infinite loop.
                    spaceLeft = 1;
                }
                if (remainingLine.length <= spaceLeft) {
                    currentChunk += remainingLine;
                    remainingLine = "";
                    // We are done with this line.
                    // But we used logic that assumed we might split. 
                    // Now that we fit the rest, strict correctness for state update?
                    // The line is finished. logic continues to next line.
                    // Logic loop handles state update at end.
                    openCodeBlock = nextOpenCodeBlock;
                }
                else {
                    // Must split chunk
                    let splitIdx = spaceLeft;
                    // Try to split at space
                    const safeChunk = remainingLine.substring(0, spaceLeft);
                    const lastSpace = safeChunk.lastIndexOf(" ");
                    if (lastSpace > spaceLeft * 0.8) {
                        splitIdx = lastSpace;
                    }
                    const part = remainingLine.substring(0, splitIdx);
                    currentChunk += part;
                    // Close and push
                    if (openCodeBlock !== null)
                        currentChunk += "\n```";
                    chunks.push(currentChunk);
                    // Start next piece
                    currentChunk = "";
                    if (openCodeBlock !== null)
                        currentChunk += `\`\`\`${openCodeBlock}\n`;
                    remainingLine = remainingLine.substring(splitIdx).trimStart(); // trim start space if we split at space
                }
            }
        }
    }
    if (currentChunk.length > 0) {
        if (openCodeBlock !== null) {
            currentChunk += "\n```";
        }
        chunks.push(currentChunk);
    }
    return chunks;
}
//# sourceMappingURL=utils.js.map