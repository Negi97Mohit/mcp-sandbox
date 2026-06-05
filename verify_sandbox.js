import { handleFileTool } from './src/tools/files.js';
import { handleShellCommand } from './src/tools/shell.js';
import { workspaceManager } from './src/core/WorkspaceManager.js';
import * as path from 'path';
import * as fs from 'fs';
async function runTests() {
    console.log("🧪 Starting Verification Tests...\n");
    const testUserId = "test-user-123";
    const workspaceRoot = workspaceManager.ensureWorkspace(testUserId);
    console.log(`📂 Created workspace: ${workspaceRoot}`);
    // Contexts
    const adminContext = { channelId: 'admin-chan', sendLog: async (t) => console.log(`[LOG]: ${t}`) };
    const userContext = {
        channelId: 'user-chan',
        sendLog: async (t) => console.log(`[LOG]: ${t}`),
        userId: testUserId,
        workspaceRoot: workspaceRoot
    };
    // TEST 1: User Write (Allowed)
    console.log("\n🔹 Test 1: User Write (Allowed)");
    const file1 = "hello.txt";
    const result1 = await handleFileTool("write_file", { path: file1, content: "Hello World" }, userContext);
    console.log("Result:", result1);
    const exists1 = fs.existsSync(path.join(workspaceRoot, file1));
    console.log("Verified File Exists:", exists1);
    // TEST 2: User Write Escape (Blocked)
    console.log("\n🔹 Test 2: User Write Escape (Blocked)");
    try {
        const result2 = await handleFileTool("write_file", { path: "../escape.txt", content: "Hacked" }, userContext);
        console.log("Result (Should fail):", result2);
    }
    catch (e) {
        console.log("Caught Expected Error:", e.message);
    }
    // TEST 3: User Read Escape (Blocked)
    console.log("\n🔹 Test 3: User Read Escape (Blocked)");
    try {
        const result3 = await handleFileTool("read_file", { path: "../../../package.json" }, userContext); // Try to read root package.json
        console.log("Result (Should fail):", result3);
    }
    catch (e) {
        console.log("Caught Expected Error:", e.message);
    }
    // TEST 4: Shell CWD Check
    console.log("\n🔹 Test 4: Shell CWD Check");
    const result4 = await handleShellCommand({ command: "cd ." }, userContext);
    console.log("Current Dir:", result4.currentDir);
    console.log("Is Inside Workspace:", result4.currentDir.startsWith(workspaceRoot));
    // TEST 5: Shell Escape
    console.log("\n🔹 Test 5: Shell Escape");
    const result5 = await handleShellCommand({ command: "cd .." }, userContext);
    console.log("Result:", result5);
    console.log("\n✅ Tests Completed.");
}
runTests();
//# sourceMappingURL=verify_sandbox.js.map