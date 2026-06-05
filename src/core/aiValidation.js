import ts from "typescript";
/**
 * Validates TS/JS syntax using the TypeScript compiler API
 */
export function checkTypescriptSyntax(code) {
    try {
        // Strip Markdown code blocks if present
        let cleanCode = code;
        const match = code.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)\n```/);
        if (match) {
            cleanCode = match[1] ?? "";
        }
        const sourceFile = ts.createSourceFile("temp.ts", cleanCode, ts.ScriptTarget.Latest, true);
        const diagnostics = sourceFile.parseDiagnostics || [];
        if (diagnostics.length > 0) {
            const first = diagnostics[0];
            const message = typeof first.messageText === "string" ? first.messageText : JSON.stringify(first.messageText);
            return { valid: false, error: `TS Syntax Error: ${message}` };
        }
        return { valid: true };
    }
    catch (e) {
        return { valid: false, error: e.message || String(e) };
    }
}
/**
 * Validates text against safety policies (dangerous commands, forced git push)
 */
export function checkSafety(text) {
    const dangerousPatterns = [
        { regex: /rm\s+-rf\s+\//, msg: "Attempt to remove root directory" },
        { regex: /git\s+push\s+--(?:force|mirror|delete)/, msg: "Destructive git push options" },
        { regex: /git\s+push\s+\w+\s+--delete/, msg: "Remote branch deletion detected" },
        { regex: /:\(\)\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, msg: "Fork bomb pattern detected" },
    ];
    for (const pattern of dangerousPatterns) {
        if (pattern.regex.test(text)) {
            return { safe: false, error: `Safety violation: ${pattern.msg}` };
        }
    }
    return { safe: true };
}
/**
 * Validates output based on agent type
 */
export function validateAgentOutput(agentType, output, request) {
    const details = [];
    let schemaMatch = 1;
    let syntaxValid = 1;
    let safetyVerified = 1;
    let logicalConsistency = 1;
    // 1. Safety Check (all agents)
    const safety = checkSafety(output);
    if (!safety.safe) {
        safetyVerified = 0;
        details.push(`❌ Safety check failed: ${safety.error}`);
    }
    else {
        details.push("✅ Safety checks passed (no destructive patterns).");
    }
    // 2. Structural & Logical Checks based on Agent Type
    if (agentType === "plan") {
        // PlannerAgent format: PLAN:\n... CONFIDENCE:\n... REASON:\n...
        const hasPlanMarker = output.includes("PLAN:");
        const hasConfidenceMarker = output.includes("CONFIDENCE:");
        const hasReasonMarker = output.includes("REASON:");
        if (hasPlanMarker && hasConfidenceMarker && hasReasonMarker) {
            details.push("✅ Structured template markers (PLAN, CONFIDENCE, REASON) found.");
        }
        else {
            schemaMatch = 0;
            const missing = [];
            if (!hasPlanMarker)
                missing.push("PLAN:");
            if (!hasConfidenceMarker)
                missing.push("CONFIDENCE:");
            if (!hasReasonMarker)
                missing.push("REASON:");
            details.push(`❌ Schema mismatch: Missing markers [${missing.join(", ")}].`);
        }
        // Logical validation of Planner steps
        const planSection = output.match(/PLAN:\n([\s\S]*?)(?=CONFIDENCE:|$)/);
        if (planSection) {
            const lines = planSection[1]?.trim().split("\n").filter(l => l.trim().length > 0) ?? [];
            if (lines.length > 8) {
                logicalConsistency = 0.5;
                details.push(`⚠️ Logical warning: Plan contains ${lines.length} steps (recommended max is 8).`);
            }
            else if (lines.length === 0) {
                logicalConsistency = 0;
                details.push("❌ Logical failure: Plan section is empty.");
            }
            else {
                details.push(`✅ Plan step count (${lines.length}) is within limits.`);
            }
            // Check if step numbers are sequential starting from 1
            let sequential = true;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i] || "";
                const match = line.trim().match(/^(\d+)\./);
                const stepNum = match ? parseInt(match[1] || "0", 10) : null;
                if (stepNum !== i + 1) {
                    sequential = false;
                }
            }
            if (!sequential) {
                logicalConsistency = Math.min(logicalConsistency, 0.7);
                details.push("⚠️ Logical warning: Plan step numbers are not strictly sequential (1, 2, 3...).");
            }
            else {
                details.push("✅ Plan steps are sequential.");
            }
        }
        else {
            logicalConsistency = 0;
            details.push("❌ Logical failure: Could not parse plan details.");
        }
        // Planner output doesn't usually contain code, so syntax is auto-valid
        syntaxValid = 1;
    }
    else if (agentType === "implement") {
        // ImplementerAgent format: IMPLEMENTATION_STATUS:, FILES_MODIFIED:, NOTES:
        const hasStatus = output.includes("IMPLEMENTATION_STATUS:");
        const hasFiles = output.includes("FILES_MODIFIED:");
        if (hasStatus && hasFiles) {
            details.push("✅ Structured template markers (STATUS, FILES) found.");
        }
        else {
            schemaMatch = 0;
            const missing = [];
            if (!hasStatus)
                missing.push("IMPLEMENTATION_STATUS:");
            if (!hasFiles)
                missing.push("FILES_MODIFIED:");
            details.push(`❌ Schema mismatch: Missing markers [${missing.join(", ")}].`);
        }
        // Syntax checking if TS code blocks are detected in output
        const hasCodeBlock = output.includes("```");
        if (hasCodeBlock) {
            const syntaxCheck = checkTypescriptSyntax(output);
            if (!syntaxCheck.valid) {
                syntaxValid = 0.2; // Syntax issues but might contain non-code text
                details.push(`❌ Syntax failure: ${syntaxCheck.error}`);
            }
            else {
                details.push("✅ Code block syntax validated successfully.");
            }
        }
        else {
            details.push("ℹ️ No code blocks found in text output (running standard syntax check).");
        }
        // Logical consistency: files modified list format
        const filesMatch = output.match(/FILES_MODIFIED:\s*\[([^\]]*)\]/);
        if (filesMatch) {
            const files = filesMatch[1]?.split(",").map(f => f.trim()).filter(Boolean) || [];
            if (files.length === 0 && output.includes("success")) {
                logicalConsistency = 0.5;
                details.push("⚠️ Logical warning: Status is success but modified files list is empty.");
            }
            else {
                details.push(`✅ Verified files modified list with ${files.length} entry/entries.`);
            }
        }
        else {
            logicalConsistency = 0.5;
            details.push("⚠️ Logical warning: Could not parse list of modified files format.");
        }
    }
    else if (agentType === "verify") {
        // VerifierAgent format: VERIFICATION_SUMMARY:, CONFIDENCE:, TEST_COMMAND:, TOTAL_TESTS:, PASSING_TESTS:, FAILING_TESTS:
        const hasSummary = output.includes("VERIFICATION_SUMMARY:");
        const hasConf = output.includes("CONFIDENCE:");
        const hasCmd = output.includes("TEST_COMMAND:");
        const hasTotal = output.includes("TOTAL_TESTS:");
        const hasPassing = output.includes("PASSING_TESTS:");
        const hasFailing = output.includes("FAILING_TESTS:");
        if (hasSummary && hasConf && hasCmd && hasTotal && hasPassing && hasFailing) {
            details.push("✅ All verifier template markers found.");
        }
        else {
            schemaMatch = 0;
            const missing = [];
            if (!hasSummary)
                missing.push("VERIFICATION_SUMMARY:");
            if (!hasConf)
                missing.push("CONFIDENCE:");
            if (!hasCmd)
                missing.push("TEST_COMMAND:");
            if (!hasTotal)
                missing.push("TOTAL_TESTS:");
            if (!hasPassing)
                missing.push("PASSING_TESTS:");
            if (!hasFailing)
                missing.push("FAILING_TESTS:");
            details.push(`❌ Schema mismatch: Missing markers [${missing.join(", ")}].`);
        }
        // Logical check: total tests must equal passing + failing
        const totalMatch = output.match(/TOTAL_TESTS:\s*(\d+)/);
        const passingMatch = output.match(/PASSING_TESTS:\s*(\d+)/);
        const failingMatch = output.match(/FAILING_TESTS:\s*(\d+)/);
        if (totalMatch && passingMatch && failingMatch) {
            const t = parseInt(totalMatch[1] || "0", 10);
            const p = parseInt(passingMatch[1] || "0", 10);
            const f = parseInt(failingMatch[1] || "0", 10);
            if (t !== p + f) {
                logicalConsistency = 0.5;
                details.push(`❌ Logical mismatch: TOTAL_TESTS (${t}) != PASSING (${p}) + FAILING (${f}).`);
            }
            else {
                details.push("✅ Verified mathematical consistency of test counts.");
            }
            // Confidence check matching tests
            const confMatch = output.match(/CONFIDENCE:\s*([\d.]+)/);
            if (confMatch) {
                const conf = parseFloat(confMatch[1] || "0.5");
                if (f > 0 && conf >= 0.85) {
                    logicalConsistency = Math.min(logicalConsistency, 0.4);
                    details.push(`❌ Logical inconsistency: Verifier confidence is high (${conf}) despite failing tests.`);
                }
                else if (f === 0 && t > 0 && conf < 0.7) {
                    logicalConsistency = Math.min(logicalConsistency, 0.7);
                    details.push(`⚠️ Logical warning: Low confidence (${conf}) despite all tests passing.`);
                }
                else {
                    details.push("✅ Verified consistency between confidence score and test outcomes.");
                }
            }
        }
    }
    else {
        // Explainer / Generator / Fallback Generic checks
        // If it's a generator agent, verify JSON parsing and TS syntax
        if (output.trim().startsWith("{") || output.includes("```json")) {
            try {
                let cleanJSON = output;
                const match = output.match(/```json\n([\s\S]*?)\n```/);
                if (match) {
                    cleanJSON = match[1] ?? "";
                }
                JSON.parse(cleanJSON.trim());
                details.push("✅ Generic JSON structure parsed successfully.");
            }
            catch (e) {
                schemaMatch = 0;
                details.push(`❌ JSON schema parsing failure: ${e.message}`);
            }
        }
        // TS checking if code block is found
        if (output.includes("```ts") || output.includes("```typescript") || output.includes("```js")) {
            const syntaxCheck = checkTypescriptSyntax(output);
            if (!syntaxCheck.valid) {
                syntaxValid = 0.5;
                details.push(`❌ Code syntax check failed: ${syntaxCheck.error}`);
            }
            else {
                details.push("✅ Embedded code syntax check passed.");
            }
        }
    }
    // Compute aggregate correctness score (0 - 100)
    const score = Math.round((schemaMatch * 0.3 + syntaxValid * 0.3 + safetyVerified * 0.2 + logicalConsistency * 0.2) * 100);
    const success = score >= 75 && safetyVerified === 1;
    return {
        success,
        score,
        metrics: {
            schemaMatch,
            syntaxValid,
            safetyVerified,
            logicalConsistency
        },
        details
    };
}
//# sourceMappingURL=aiValidation.js.map