import { Client, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import admin from "firebase-admin";

dotenv.config();
const execAsync = promisify(exec);

// --- CONFIGURATION ---
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
const ALLOWED_USER_ID = process.env.ALLOWED_USER_ID!;

// 🚀 REASONING MODEL (DeepSeek R1 is excellent for this)
const MODEL_NAME = process.env.MODEL_NAME || "nvidia/nemotron-3-nano-30b-a3b:free";

// const SAFE_ROOT = path.join(process.cwd(), "workspace");
let currentDir = process.cwd();

// --- FIREBASE SETUP ---
const SERVICE_KEY_PATH = path.join(process.cwd(), "service-account.json");
let isFirebaseActive = false;
if (fs.existsSync(SERVICE_KEY_PATH)) {
  try {
    const serviceAccount = JSON.parse(
      fs.readFileSync(SERVICE_KEY_PATH, "utf-8"),
    );
    if (!admin.apps.length)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    isFirebaseActive = true;
    console.log("🔥 Firebase Admin SDK: Connected");
  } catch (e) {
    console.error("⚠️ Firebase Error:", e);
  }
}
// if (!fs.existsSync(SAFE_ROOT)) fs.mkdirSync(SAFE_ROOT);

// --- 1. TOOL DEFINITIONS ---
// (We keep tool definitions simple for JSON serialization)
const tools = [
  {
    type: "function",
    function: {
      name: "run_shell",
      description: "Execute shell command (git, npm, ls).",
      parameters: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write file content.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read file content.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List files in current dir.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "find_git_repos",
      description: "Search for git repositories in the user's home directory.",
      parameters: {
        type: "object",
        properties: {
          start_path: {
            type: "string",
            description: "Path to start searching from (default: User Home)",
          },
        },
      },
    },
  },
];

// --- 2. TOOL EXECUTION LOGIC ---
function resolveSafePath(relativePath: string): string {
  const resolved = path.resolve(currentDir, relativePath);
  // if (!resolved.startsWith(SAFE_ROOT)) throw new Error(`🚫 Access Denied.`);
  return resolved;
}

async function executeTool(name: string, args: any) {
  console.log(`\n⚙️  [System] Executing: ${name}`);
  try {
    if (name === "run_shell") {
      if (args.command.trim().startsWith("cd ")) {
        const newPath = args.command.split(" ")[1];
        try {
          const target = resolveSafePath(newPath);
          if (fs.existsSync(target)) {
            currentDir = target;
            console.log(`📂 Changed dir to: ${currentDir}`);
            return { output: `Changed directory to: ${currentDir}` };
          }
        } catch (e) {
          return { error: "Invalid path" };
        }
        return { error: "Dir not found" };
      }
      console.log(`$> ${args.command}`);
      const { stdout, stderr } = await execAsync(args.command, {
        cwd: currentDir,
      });
      const out = stdout.trim().slice(0, 1500);
      const err = stderr.trim();
      if (out) console.log(`Result: ${out.slice(0, 100)}...`);
      if (err) console.error(`Error: ${err}`);
      return { stdout: out, stderr: err };
    }
    if (name === "write_file") {
      const p = resolveSafePath(args.path);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, args.content);
      console.log(`✍️ Wrote file: ${p}`);
      return { success: true };
    }
    if (name === "read_file") {
      console.log(`📖 Reading file: ${args.path}`);
      return { content: fs.readFileSync(resolveSafePath(args.path), "utf-8") };
    }
    if (name === "list_files") {
      console.log(`📂 Listing files in: ${currentDir}`);
      return { files: fs.readdirSync(currentDir) };
    }
    if (name === "find_git_repos") {
      const startPath = args.start_path || process.env.USERPROFILE || process.env.HOME || ".";
      console.log(`🔎 Searching for Git repos starting at: ${startPath}`);

      const foundRepos: string[] = [];
      const ignoreDirs = new Set(["node_modules", "dist", "build", ".vscode", ".idea", "AppData", "Application Data"]);

      function search(dir: string, depth: number) {
        if (depth > 5) return; // Limit depth to avoid taking forever
        if (foundRepos.length >= 20) return; // Limit results

        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });

          // Check if this dir is a git repo
          if (entries.some(e => e.isDirectory() && e.name === ".git")) {
            foundRepos.push(dir);
            // Don't search inside a repo unless we want submodules, but let's keep it simple
            return;
          }

          for (const entry of entries) {
            if (entry.isDirectory()) {
              if (entry.name.startsWith(".")) continue; // Skip hidden dirs (except .git check above)
              if (ignoreDirs.has(entry.name)) continue;

              search(path.join(dir, entry.name), depth + 1);
            }
          }
        } catch (e) {
          // Ignore access errors
        }
      }

      search(startPath, 0);
      console.log(`✅ Found ${foundRepos.length} repos.`);
      return { repositories: foundRepos };
    }
    return { error: "Unknown tool" };
  } catch (e: any) {
    console.error(`❌ Tool Error: ${e.message}`);
    return { error: e.message };
  }
}

// --- 3. CUSTOM FETCH FUNCTION (The "Reasoning" Engine) ---
// This replaces the OpenAI library to support 'reasoning_details'
async function callOpenRouter(messages: any[]) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://discord-agent.com",
        "X-Title": "DevOps Agent",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages,
        tools: tools, // Send tools
        // 💡 ENABLE REASONING HERE
        reasoning: { enabled: true },
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
  return data.choices[0].message;
}

// --- 4. DISCORD CLIENT ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Store history WITH reasoning details
const chatHistory: Map<string, any[]> = new Map();

client.once("ready", () => {
  console.log(`🤖 Reasoning Bot Online: ${client.user?.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (ALLOWED_USER_ID && message.author.id !== ALLOWED_USER_ID) return;

  await message.channel.sendTyping();

  if (!chatHistory.has(message.channel.id)) {
    chatHistory.set(message.channel.id, [
      {
        role: "system",
        content:
          "You are a DevOps Agent connected to the user's local machine. You have FULL access to the file system. Use tools to manage Git repositories and files. GLOBAL SEARCH: If the user asks about a repo and you don't know where it is, use `find_git_repos` to look for it. Once found, `cd` into it to answer questions. Think step-by-step.",
      },
    ]);
  }
  const history = chatHistory.get(message.channel.id)!;
  history.push({ role: "user", content: message.content });

  try {
    // 1. Initial Call (Using raw fetch to capture reasoning)
    let aiMessage = await callOpenRouter(history);

    // 💡 CRITICAL: Preserve the reasoning_details for the next turn
    // This is exactly what your snippet demonstrated
    const historyEntry: any = {
      role: "assistant",
      content: aiMessage.content,
      tool_calls: aiMessage.tool_calls,
    };

    if (aiMessage.reasoning_details) {
      historyEntry.reasoning_details = aiMessage.reasoning_details;
    }

    history.push(historyEntry);

    // 2. Handle Tools
    if (aiMessage.tool_calls) {
      for (const toolCall of aiMessage.tool_calls) {
        await message.channel.send(
          `⚙️ *Thinking... then running ${toolCall.function.name}*`,
        );

        const args = JSON.parse(toolCall.function.arguments);
        const toolResult = await executeTool(toolCall.function.name, args);

        history.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      // 3. Final Answer (Recursive call with updated history)
      const finalAiMessage = await callOpenRouter(history);

      // Preserve reasoning again
      const finalEntry: any = {
        role: "assistant",
        content: finalAiMessage.content,
      };
      if (finalAiMessage.reasoning_details)
        finalEntry.reasoning_details = finalAiMessage.reasoning_details;
      history.push(finalEntry);

      // Output to Discord
      // Output to Discord
      let text = finalAiMessage.content;
      if (!text && finalAiMessage.reasoning_content) {
        text = `**My Thoughts:**\n${finalAiMessage.reasoning_content}`;
      }
      text = text || "Done (No content returned by AI).";

      if (text.length > 2000) {
        const chunks = text.match(/[\s\S]{1,1900}/g) || [];
        for (const chunk of chunks) await message.channel.send(chunk);
      } else {
        await message.reply(text);
      }
    } else {
      // No tools, just reply
      // Check if there is reasoning content to show?
      // Some models put reasoning in `reasoning_content` (DeepSeek)
      if (aiMessage.reasoning_content) {
        // Optional: Print the "Thoughts" to Discord inside a spoiler
        const thoughts = `||**My Thoughts:**\n${aiMessage.reasoning_content.substring(0, 1000)}...||\n\n`;
        await message.reply(thoughts + aiMessage.content);
      } else {
        await message.reply(aiMessage.content || ".");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    await message.reply("⚠️ Error connecting to OpenRouter Reasoning API.");
  }
});

client.login(DISCORD_TOKEN);
