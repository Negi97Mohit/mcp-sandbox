import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

const execAsync = promisify(exec);

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

let currentDir = process.cwd();

export async function handleShellCommand(args: { command: string }) {
    const { command } = args;

    if (command.trim().startsWith("cd ")) {
        const newPath = command.split(" ")[1];
        try {
            // Resolve path relative to currentDir or absolute
            const target = path.resolve(currentDir, newPath);
            if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
                currentDir = target;
                console.log(`📂 Changed dir to: ${currentDir}`);
                return { output: `Changed directory to: ${currentDir}`, currentDir };
            } else {
                return { error: `Directory not found: ${target}` };
            }
        } catch (e: any) {
            return { error: `Invalid path: ${e.message}` };
        }
    }

    console.log(`$> ${command} (in ${currentDir})`);
    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd: currentDir,
            maxBuffer: 1024 * 1024 * 5, // 5MB buffer
        });
        const out = stdout.trim();
        const err = stderr.trim();

        // Truncate output if too long for Discord, but returns enough for context
        const displayOut = out.length > 1800 ? out.slice(0, 1800) + "\n... (output truncated)" : out;

        if (out) console.log(`Result: ${out.slice(0, 100)}...`);
        if (err) console.error(`Error: ${err}`);

        return { stdout: displayOut, stderr: err, currentDir };
    } catch (e: any) {
        return { error: e.message, stderr: e.stderr, stdout: e.stdout };
    }
}
