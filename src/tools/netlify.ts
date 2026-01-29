import { handleShellCommand } from "./shell.js";
import type { ToolContext } from "../types/toolContext.js";

export const netlifyTools = [
    {
        type: "function",
        function: {
            name: "netlify_env_manage",
            description: "Manage environment variables for the Netlify site.",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: ["set", "get", "list", "unset", "import"],
                        description: "Action to perform."
                    },
                    key: { type: "string", description: "Environment variable key (for set, get, unset)." },
                    value: { type: "string", description: "Environment variable value (for set)." },
                    context: { type: "string", description: "Deploy context (e.g., 'production', 'deploy-preview')." },
                    file: { type: "string", description: "Path to .env file (for import)." }
                },
                required: ["action"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "netlify_functions_manage",
            description: "Manage Netlify serverless functions.",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: ["list", "serve", "invoke", "create"],
                        description: "Action to perform."
                    },
                    name: { type: "string", description: "Function name (for invoke, create)." },
                    args: { type: "string", description: "Additional arguments (e.g. --name for create)." }
                },
                required: ["action"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "netlify_site_manage",
            description: "Manage Netlify sites (link, unlink, init, info, list, status).",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: ["list", "info", "init", "link", "unlink", "status"],
                        description: "Action to perform."
                    },
                    siteName: { type: "string", description: "Site name or ID (for info, link)." },
                    manual: { type: "boolean", description: "Use manual setup for init." }
                },
                required: ["action"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "netlify_deploy",
            description: "Deploy the current directory to Netlify.",
            parameters: {
                type: "object",
                properties: {
                    prod: { type: "boolean", description: "If true, deploy to production." },
                    build: { type: "boolean", description: "If true, run build command before deploying." },
                    message: { type: "string", description: "Deploy message." },
                    alias: { type: "string", description: "Deploy alias (e.g. 'preview')." }
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "netlify_build_run",
            description: "Run Netlify build locally.",
            parameters: {
                type: "object",
                properties: {
                    dry: { type: "boolean", description: "Dry run (no output files)." },
                    context: { type: "string", description: "Build context (e.g. production)." }
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "netlify_dev_exec",
            description: "Execute a command inside the Netlify Dev environment.",
            parameters: {
                type: "object",
                properties: {
                    command: { type: "string", description: "Command to execute (e.g. 'npm run test')." }
                },
                required: ["command"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "netlify_run",
            description: "Run any generic Netlify CLI command not covered by other tools.",
            parameters: {
                type: "object",
                properties: {
                    args: { type: "string", description: "Arguments to pass to the netlify command." },
                },
                required: ["args"],
            },
        },
    },
];

export async function handleNetlifyTool(name: string, args: any, context?: ToolContext) {
    if (name === "netlify_env_manage") {
        let cmd = "netlify env";
        switch (args.action) {
            case "set":
                if (!args.key) return { error: "Key is required for 'set' action" };
                cmd += `:set ${args.key}`;
                if (args.value) cmd += ` "${args.value}"`;
                if (args.context) cmd += ` --context ${args.context}`;
                break;
            case "get":
                if (!args.key) return { error: "Key is required for 'get' action" };
                cmd += `:get ${args.key}`;
                if (args.context) cmd += ` --context ${args.context}`;
                break;
            case "list":
                cmd += ":list";
                if (args.context) cmd += ` --context ${args.context}`;
                break;
            case "unset":
                if (!args.key) return { error: "Key is required for 'unset' action" };
                cmd += `:unset ${args.key}`;
                if (args.context) cmd += ` --context ${args.context}`;
                break;
            case "import":
                if (!args.file) return { error: "File is required for 'import' action" };
                cmd += `:import ${args.file}`;
                break;
            default:
                return { error: `Unknown env action: ${args.action}` };
        }
        return handleShellCommand({ command: cmd }, context);
    }

    if (name === "netlify_functions_manage") {
        let cmd = "netlify functions";
        switch (args.action) {
            case "list":
                cmd += ":list";
                break;
            case "serve":
                cmd += ":serve";
                break;
            case "invoke":
                if (!args.name) return { error: "Function name is required for 'invoke'" };
                cmd += `:invoke ${args.name}`;
                break;
            case "create":
                cmd += ":create";
                if (args.name) cmd += ` --name ${args.name}`;
                break;
            default:
                return { error: `Unknown functions action: ${args.action}` };
        }
        if (args.args) cmd += ` ${args.args}`;
        return handleShellCommand({ command: cmd }, context);
    }

    if (name === "netlify_site_manage") {
        let cmd = "netlify";
        switch (args.action) {
            case "list":
                cmd += " sites:list";
                break;
            case "info":
                cmd += " sites:info";
                if (args.siteName) cmd += ` --site-name ${args.siteName}`;
                break;
            case "init":
                cmd += " init";
                if (args.manual) cmd += " --manual";
                break;
            case "link":
                cmd += " link";
                if (args.siteName) cmd += ` --name ${args.siteName}`;
                break;
            case "unlink":
                cmd += " unlink";
                break;
            case "status":
                cmd += " status";
                break;
            default:
                return { error: `Unknown site action: ${args.action}` };
        }
        return handleShellCommand({ command: cmd }, context);
    }

    if (name === "netlify_deploy") {
        let command = "netlify deploy";
        if (args.prod) command += " --prod";
        if (args.build) command += " --build";
        if (args.message) command += ` --message "${args.message}"`;
        if (args.alias) command += ` --alias ${args.alias}`;
        return handleShellCommand({ command }, context);
    }

    if (name === "netlify_build_run") {
        let command = "netlify build";
        if (args.dry) command += " --dry";
        if (args.context) command += ` --context ${args.context}`;
        return handleShellCommand({ command }, context);
    }

    if (name === "netlify_dev_exec") {
        return handleShellCommand({ command: `netlify dev:exec ${args.command}` }, context);
    }

    if (name === "netlify_run") {
        return handleShellCommand({ command: `netlify ${args.args}` }, context);
    }

    return { error: `Unknown Netlify tool: ${name}` };
}
