import { handleShellCommand } from "./shell.js";
import * as fs from "fs";
import * as path from "path";
import { workspaceStore } from "../core/WorkspaceStore.js";
export const projectTools = [
    {
        type: "function",
        function: {
            name: "project_init",
            description: "Initialize a new project scaffold (Vite/React, Next.js, Express/Node, Python) inside the workspace.",
            parameters: {
                type: "object",
                properties: {
                    template: {
                        type: "string",
                        enum: ["vite-react", "nextjs", "express-node", "python"],
                        description: "The boilerplate template to initialize"
                    },
                    dir_name: {
                        type: "string",
                        description: "Optional folder name to create inside the workspace (defaults to the workspace root itself)"
                    }
                },
                required: ["template"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "docker_container_manage",
            description: "Manage Docker images and containers for project runtime (build, run, stop, list, logs).",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: ["build", "run", "stop", "list", "logs"],
                        description: "Docker action to perform"
                    },
                    image_name: { type: "string", description: "Image tag name (required for build and run)" },
                    container_name: { type: "string", description: "Container instance name (required for run, stop, and logs)" },
                    ports: { type: "string", description: "Host to container port mapping, e.g. '3000:3000' (for run)" },
                    dockerfile_path: { type: "string", description: "Optional path to Dockerfile (for build, defaults to './Dockerfile')" }
                },
                required: ["action"]
            }
        }
    }
];
export async function handleProjectTool(name, args, context) {
    const baseDir = context?.workspaceRoot || workspaceStore.getActivePath() || process.cwd();
    // Ensure the base directory exists
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }
    try {
        if (name === "project_init") {
            let targetDir = baseDir;
            if (args.dir_name) {
                targetDir = path.resolve(baseDir, args.dir_name);
                // Security check
                if (context?.workspaceRoot && !targetDir.startsWith(context.workspaceRoot)) {
                    return { error: "Access Denied: Cannot initialize project outside your workspace root." };
                }
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
            }
            // Verify directory is empty to prevent overwriting
            const files = fs.readdirSync(targetDir);
            if (files.length > 0 && args.template !== "python") {
                return { error: `The target directory "${targetDir}" is not empty. Please specify an empty subfolder using 'dir_name'.` };
            }
            if (context)
                await context.sendLog(`🚀 *Initializing template "${args.template}" in: ${targetDir}...*`);
            if (args.template === "vite-react") {
                // We run npm create vite
                const cmd = `npm create vite@latest . -- --template react-ts --yes && npm install`;
                // To execute in targetDir, we temporarily change directory if handled inside shell command, 
                // but wait, handleShellCommand operates on the session CWD.
                // We should pass a command that navigates to targetDir or we can rely on handleShellCommand's CD capability.
                // In shell.ts, we can navigate or execute. Let's execute cd to targetDir first in the command chain!
                const fullCmd = process.platform === "win32"
                    ? `cd /d "${targetDir}" && ${cmd}`
                    : `cd "${targetDir}" && ${cmd}`;
                return handleShellCommand({ command: fullCmd }, context);
            }
            if (args.template === "nextjs") {
                const cmd = `npx create-next-app@latest . --ts --eslint --app --src-dir --import-alias "@/*" --use-npm --yes && npm install`;
                const fullCmd = process.platform === "win32"
                    ? `cd /d "${targetDir}" && ${cmd}`
                    : `cd "${targetDir}" && ${cmd}`;
                return handleShellCommand({ command: fullCmd }, context);
            }
            if (args.template === "express-node") {
                // Scaffold files manually
                fs.writeFileSync(path.join(targetDir, "package.json"), JSON.stringify({
                    name: args.dir_name || "express-app",
                    version: "1.0.0",
                    type: "module",
                    main: "dist/index.js",
                    scripts: {
                        build: "tsc",
                        start: "node dist/index.js",
                        dev: "tsx watch src/index.ts"
                    },
                    dependencies: {
                        express: "^4.19.2"
                    },
                    devDependencies: {
                        "@types/express": "^4.17.21",
                        "@types/node": "^20.11.0",
                        "tsx": "^4.7.0",
                        "typescript": "^5.3.3"
                    }
                }, null, 2));
                fs.writeFileSync(path.join(targetDir, "tsconfig.json"), JSON.stringify({
                    compilerOptions: {
                        target: "ES2022",
                        module: "NodeNext",
                        moduleResolution: "NodeNext",
                        outDir: "./dist",
                        rootDir: "./src",
                        strict: true,
                        esModuleInterop: true,
                        skipLibCheck: true
                    },
                    include: ["src/**/*"]
                }, null, 2));
                fs.mkdirSync(path.join(targetDir, "src"), { recursive: true });
                fs.writeFileSync(path.join(targetDir, "src/index.ts"), `import express from 'express';\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Hello from Sandboxed Express Agent!' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`⚡ Server running on port \${PORT}\`);\n});\n`);
                const cmd = `npm install`;
                const fullCmd = process.platform === "win32"
                    ? `cd /d "${targetDir}" && ${cmd}`
                    : `cd "${targetDir}" && ${cmd}`;
                return handleShellCommand({ command: fullCmd }, context);
            }
            if (args.template === "python") {
                fs.writeFileSync(path.join(targetDir, "main.py"), `import os\n\ndef main():\n    print("🐍 Hello from Sandboxed Python Agent!")\n    print(f"Working Directory: {os.getcwd()}")\n\nif __name__ == '__main__':\n    main()\n`);
                fs.writeFileSync(path.join(targetDir, "requirements.txt"), `requests>=2.31.0\n`);
                const cmd = process.platform === "win32"
                    ? `python -m venv venv && call venv\\Scripts\\activate && pip install -r requirements.txt`
                    : `python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`;
                const fullCmd = process.platform === "win32"
                    ? `cd /d "${targetDir}" && ${cmd}`
                    : `cd "${targetDir}" && ${cmd}`;
                return handleShellCommand({ command: fullCmd }, context);
            }
        }
        if (name === "docker_container_manage") {
            const action = args.action;
            if (action === "list") {
                return handleShellCommand({ command: "docker ps -a" }, context);
            }
            if (action === "build") {
                if (!args.image_name)
                    return { error: "Image name (tag) is required to build a Docker image." };
                const dockerfilePath = args.dockerfile_path || "./Dockerfile";
                const resolvedDockerfile = path.resolve(baseDir, dockerfilePath);
                if (context?.workspaceRoot && !resolvedDockerfile.startsWith(context.workspaceRoot)) {
                    return { error: "Access Denied: Dockerfile path escapes workspace root." };
                }
                const cmd = `docker build -t ${args.image_name} -f "${resolvedDockerfile}" .`;
                const fullCmd = process.platform === "win32"
                    ? `cd /d "${baseDir}" && ${cmd}`
                    : `cd "${baseDir}" && ${cmd}`;
                if (context)
                    await context.sendLog(`🐳 *Building docker image ${args.image_name} from ${dockerfilePath}...*`);
                return handleShellCommand({ command: fullCmd }, context);
            }
            if (action === "run") {
                if (!args.image_name)
                    return { error: "Image name is required to run a container." };
                if (!args.container_name)
                    return { error: "Container name is required to run an instance." };
                let cmd = `docker run -d --name ${args.container_name}`;
                if (args.ports) {
                    cmd += ` -p ${args.ports}`;
                }
                cmd += ` ${args.image_name}`;
                if (context)
                    await context.sendLog(`🐳 *Launching docker container ${args.container_name} (${args.image_name})...*`);
                return handleShellCommand({ command: cmd }, context);
            }
            if (action === "stop") {
                if (!args.container_name)
                    return { error: "Container name or ID is required to stop/delete." };
                if (context)
                    await context.sendLog(`🐳 *Stopping and removing container: ${args.container_name}...*`);
                const cmd = `docker stop ${args.container_name} && docker rm ${args.container_name}`;
                return handleShellCommand({ command: cmd }, context);
            }
            if (action === "logs") {
                if (!args.container_name)
                    return { error: "Container name or ID is required to view logs." };
                const cmd = `docker logs --tail 200 ${args.container_name}`;
                return handleShellCommand({ command: cmd }, context);
            }
        }
        return { error: `Unknown project tool action: ${name}` };
    }
    catch (e) {
        return { error: e.message || String(e) };
    }
}
//# sourceMappingURL=project.js.map