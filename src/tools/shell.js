import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
export const shellTools = [
    {
        type: "function",
        function: {
            name: "run_shell",
            description: "Execute shell command (git, npm, ls) in a specific directory or current working directory. Full system access allowed.",
            parameters: {
                type: "object",
                properties: {
                    command: { type: "string", description: "The command to execute" },
                },
                required: ["command"],
            },
        },
    },
];
// Persistent state: Channel ID -> Current Working Directory
const shellSessions = new Map();
function getSessionCwd(channelId) {
    return shellSessions.get(channelId) || process.cwd();
}
function setSessionCwd(channelId, newPath) {
    shellSessions.set(channelId, newPath);
}
export async function handleShellCommand(args, context) {
    const { command } = args;
    const channelId = context?.channelId || "default";
    // Initialize session if needed
    if (!shellSessions.has(channelId)) {
        // If sandboxed, start in workspace root. Else CWD.
        const initialDir = context?.workspaceRoot ? context.workspaceRoot : process.cwd();
        setSessionCwd(channelId, initialDir);
    }
    let currentDir = getSessionCwd(channelId);
    // FIX: Fallback if currentDir doesn't exist (deleted folder)
    if (!fs.existsSync(currentDir)) {
        currentDir = context?.workspaceRoot || process.cwd();
        setSessionCwd(channelId, currentDir);
    }
    // 1. Handle 'cd' manually
    if (command.trim().startsWith("cd ")) {
        const rawPath = command.trim().slice(3).trim();
        try {
            const target = path.resolve(currentDir, rawPath);
            // Security Check for Sandbox
            if (context?.workspaceRoot && !target.startsWith(context.workspaceRoot)) {
                return { error: `Access Denied: You cannot navigate outside your workspace.` };
            }
            if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
                setSessionCwd(channelId, target);
                const msg = `📂 Changed directory to: ${target}`;
                if (context)
                    await context.sendLog(msg);
                return { output: msg, currentDir: target };
            }
            else {
                return { error: `Directory not found: ${target}` };
            }
        }
        catch (e) {
            return { error: `Invalid path: ${e.message}` };
        }
    }
    // 2. Handle actual commands
    if (context)
        await context.sendLog(`$> ${command}`);
    // Determine shell (cmd.exe for Windows, /bin/sh for others)
    const shell = process.platform === "win32" ? "cmd.exe" : "/bin/sh";
    const shellArgs = process.platform === "win32" ? ["/c", command] : ["-c", command];
    return new Promise((resolve) => {
        const child = spawn(shell, shellArgs, {
            cwd: currentDir,
            env: process.env,
            stdio: ["ignore", "pipe", "pipe"], // ignore stdin for now
        });
        let outputBuffer = "";
        let pendingInfos = ""; // Temp buffer for throttling
        let lastOutputTime = 0;
        const flushInterval = 1500; // 1.5s throttle to avoid spamming
        // Helper to send formatted chunks
        const sendBufferedOutput = async (text) => {
            if (!text || !context)
                return;
            // Wrap in code block
            const formatted = `\`\`\`text\n${text}\n\`\`\``;
            await context.sendLog(formatted).catch(console.error);
        };
        // Helper to strip ANSI escape codes
        const stripAnsi = (str) => {
            return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        };
        // Stream handler
        const processOutput = (data) => {
            const rawText = data.toString();
            const text = stripAnsi(rawText); // Clean up colors/styles
            outputBuffer += text;
            pendingInfos += text;
            process.stdout.write(rawText); // Keep colors for server console
            if (context) {
                const now = Date.now();
                if (now - lastOutputTime > flushInterval) {
                    if (pendingInfos.length > 0) {
                        sendBufferedOutput(pendingInfos);
                        pendingInfos = "";
                        lastOutputTime = now;
                    }
                }
            }
        };
        child.stdout?.on("data", processOutput);
        child.stderr?.on("data", processOutput);
        child.on("error", (err) => {
            resolve({ error: `Failed to start command: ${err.message}` });
        });
        child.on("close", async (code) => {
            // Flush remaining
            if (context && pendingInfos.length > 0) {
                await sendBufferedOutput(pendingInfos);
            }
            const resultMsg = `\n[Process exited with code ${code}]`;
            if (context)
                await context.sendLog(resultMsg).catch(console.error);
            // Return context to LLM
            resolve({
                stdout: outputBuffer,
                exitCode: code,
                currentDir
            });
        });
    });
}
//# sourceMappingURL=shell.js.map