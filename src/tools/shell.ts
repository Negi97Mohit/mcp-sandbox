import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import type { ToolContext } from "../types/toolContext.js";

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
const shellSessions = new Map<string, string>();

function getSessionCwd(channelId: string): string {
    return shellSessions.get(channelId) || process.cwd();
}

function setSessionCwd(channelId: string, newPath: string) {
    shellSessions.set(channelId, newPath);
}

export async function handleShellCommand(args: { command: string }, context?: ToolContext) {
    const { command } = args;
    const channelId = context?.channelId || "default";
    let currentDir = getSessionCwd(channelId);

    // FIX: Fallback if currentDir doesn't exist (deleted folder)
    if (!fs.existsSync(currentDir)) {
        currentDir = process.cwd();
        setSessionCwd(channelId, currentDir);
    }

    // 1. Handle 'cd' manually
    if (command.trim().startsWith("cd ")) {
        const rawPath = command.trim().slice(3).trim();
        try {
            const target = path.resolve(currentDir, rawPath);
            if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
                setSessionCwd(channelId, target);
                const msg = `📂 Changed directory to: ${target}`;
                if (context) await context.sendLog(msg);
                return { output: msg, currentDir: target };
            } else {
                return { error: `Directory not found: ${target}` };
            }
        } catch (e: any) {
            return { error: `Invalid path: ${e.message}` };
        }
    }

    // 2. Handle actual commands
    if (context) await context.sendLog(`$> ${command}`);

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
        let lastOutputTime = 0;
        const flushInterval = 1000; // Throttle Discord updates

        // Stream handler
        const processOutput = async (data: Buffer) => {
            const text = data.toString();
            outputBuffer += text;
            process.stdout.write(text); // Log to server console too

            if (context && (Date.now() - lastOutputTime > flushInterval)) {
                // In a real app, we'd debounce this better or use a persistent message
                // For now, we'll just let it buffer in the final output or send chunks?
                // The plan said "stream via context.sendLog".
                // Let's try to send chunks if they are significant, 
                // but Discord rate limits are strict. 
                // Better strategy: We return the FINAL output to the LLM, 
                // but we assume the `sendLog` implementation handles buffering/editing.

                // Actually, let's just send "processing..." updates or minimal logs?
                // No, the user wants "streaming".
                // Let's assume one update per second max.
                if (text.length > 0) {
                    // We won't await this to avoid blocking the stream
                    context.sendLog(text).catch(console.error);
                    lastOutputTime = Date.now();
                }
            } else if (context) {
                // simple passthrough for now
                context.sendLog(text).catch(console.error);
            }
        };

        child.stdout?.on("data", processOutput);
        child.stderr?.on("data", processOutput);

        child.on("error", (err) => {
            resolve({ error: `Failed to start command: ${err.message}` });
        });

        child.on("close", (code) => {
            const resultMsg = `\n[Process exited with code ${code}]`;
            if (context) context.sendLog(resultMsg).catch(console.error);

            // Return context to LLM
            resolve({
                stdout: outputBuffer,
                exitCode: code,
                currentDir
            });
        });
    });
}
