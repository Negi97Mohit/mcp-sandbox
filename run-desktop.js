import { spawn, execSync } from "child_process";

console.log("🛠️  Compiling Electron TypeScript files...");
try {
    execSync("npx tsc -p electron/tsconfig.json", { stdio: "inherit" });
} catch (e) {
    console.error("❌ Compile failed. Attempting to run anyway...");
}

console.log("⚡ Starting Vite Frontend server...");
const vite = spawn("npm", ["run", "dev", "--prefix", "desktop-ui"], { 
    shell: true,
    stdio: "ignore" // Suppress Vite verbose output in main terminal
});

console.log("🚀 Launching Electron App...");
const electron = spawn("npx", ["electron", "dist-electron/electron/main.js"], { 
    shell: true,
    stdio: "inherit" 
});

electron.on("close", () => {
    console.log("👋 Electron window closed. Stopping Vite frontend...");
    vite.kill();
    process.exit(0);
});
