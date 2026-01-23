import { GoogleGenerativeAI } from "@google/generative-ai";
import * as readline from "readline";
import dotenv from "dotenv";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

dotenv.config();
const execAsync = promisify(exec);

// --- CONFIGURATION ---
const API_KEY = process.env.GOOGLE_API_KEY!;
// Use the model you confirmed works for you
const MODEL_NAME = "gemini-2.5-flash";

const SAFE_ROOT = path.join(process.cwd(), "workspace"); // AI can only touch this folder
let currentDir = SAFE_ROOT; // Track where the AI "is"

// Ensure workspace exists
if (!fs.existsSync(SAFE_ROOT)) {
  fs.mkdirSync(SAFE_ROOT);
  console.log(`📁 Created workspace at: ${SAFE_ROOT}`);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// --- 1. TOOL DEFINITIONS ---
const tools = [
  {
    name: "run_shell",
    description:
      "Execute a shell command in the workspace. Use this for git, npm, file operations, etc.",
    parameters: {
      type: "OBJECT",
      properties: {
        command: {
          type: "STRING",
          description: "The command to run (e.g., 'npm init', 'git status')",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file. Overwrites existing files.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: {
          type: "STRING",
          description: "Relative path to file (e.g., 'src/index.js')",
        },
        content: {
          type: "STRING",
          description: "The full content of the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: { type: "STRING", description: "Relative path to file" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List files in the current directory.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
];

// --- 2. HELPER: PATH SAFETY ---
// This prevents the AI from writing to "C:\Windows" or "../../"
function resolveSafePath(relativePath: string): string {
  const resolved = path.resolve(currentDir, relativePath);
  if (!resolved.startsWith(SAFE_ROOT)) {
    throw new Error(`🚫 Access Denied: Cannot access paths outside workspace.`);
  }
  return resolved;
}

// --- 3. TOOL EXECUTION LOGIC ---
async function executeTool(name: string, args: any) {
  console.log(`\n⚙️  [System] Executing: ${name}`);

  try {
    if (name === "run_shell") {
      // Handle "cd" commands manually since child_process is stateless
      if (args.command.trim().startsWith("cd ")) {
        const newPath = args.command.split(" ")[1];
        const target = resolveSafePath(newPath);
        if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
          currentDir = target;
          return { output: `Changed directory to: ${currentDir}` };
        } else {
          return { error: "Directory does not exist" };
        }
      }

      // Execute actual command
      const { stdout, stderr } = await execAsync(args.command, {
        cwd: currentDir,
      });
      return {
        stdout: stdout.trim() || "(No output)",
        stderr: stderr.trim() || null,
        cwd: currentDir,
      };
    }

    if (name === "write_file") {
      const targetPath = resolveSafePath(args.path);
      // Ensure folder structure exists
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, args.content);
      return { success: true, path: targetPath };
    }

    if (name === "read_file") {
      const targetPath = resolveSafePath(args.path);
      const content = fs.readFileSync(targetPath, "utf-8");
      return { content };
    }

    if (name === "list_files") {
      const files = fs.readdirSync(currentDir);
      return { files, cwd: currentDir };
    }
  } catch (err: any) {
    return { error: err.message };
  }

  return { error: "Tool not found" };
}

// --- 4. CHAT LOOP ---
async function startChat() {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    // @ts-ignore
    tools: [{ functionDeclarations: tools }],
  });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [
          {
            text: "You are a DevOps Agent. You have a safe workspace. When asked to create projects, use 'run_shell' or 'write_file'. Always check 'list_files' before assuming file structure.",
          },
        ],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to manage your workspace." }],
      },
    ],
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n🤖 Agent Online (Workspace: ${SAFE_ROOT})`);
  process.stdout.write("You: ");

  rl.on("line", async (input) => {
    if (input.trim().toLowerCase() === "exit") {
      rl.close();
      return;
    }

    try {
      let result = await chat.sendMessage(input);
      let response = result.response;
      let functionCalls = response.functionCalls();

      while (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (!call) break;

        const toolResult = await executeTool(call.name, call.args);
        console.log(
          `✅ [System] Tool Output:`,
          JSON.stringify(toolResult).substring(0, 100) + "...",
        ); // truncated log

        result = await chat.sendMessage([
          {
            functionResponse: {
              name: call.name,
              response: { name: call.name, content: toolResult },
            },
          },
        ]);

        response = result.response;
        functionCalls = response.functionCalls();
      }

      console.log(`\nGemini: ${response.text()}`);
    } catch (error) {
      console.error("\n❌ Error:", error);
    }

    process.stdout.write("\nYou: ");
  });
}

startChat();
