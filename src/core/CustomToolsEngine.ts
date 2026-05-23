import * as fs from "fs";
import * as path from "path";
import * as vm from "vm";
import { app } from "electron";

export interface CustomToolParameter {
    name: string;
    type: "string" | "number" | "boolean";
    description: string;
    required: boolean;
}

export interface CustomTool {
    id: string;
    name: string;
    description: string;
    parameters: CustomToolParameter[];
    code: string;
    createdAt: string;
}

class CustomToolsEngine {
    private dataPath: string;
    private tools: CustomTool[];

    constructor() {
        const userDataPath = app.getPath("userData");
        this.dataPath = path.join(userDataPath, "custom_tools.json");
        this.tools = this.load();
    }

    private load(): CustomTool[] {
        try {
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, "utf-8");
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error("CustomToolsEngine: Failed to load:", e);
        }
        return [];
    }

    private save(): void {
        try {
            fs.mkdirSync(path.dirname(this.dataPath), { recursive: true });
            fs.writeFileSync(this.dataPath, JSON.stringify(this.tools, null, 2));
        } catch (e) {
            console.error("CustomToolsEngine: Failed to save:", e);
        }
    }

    list(): CustomTool[] {
        return [...this.tools];
    }

    create(tool: Omit<CustomTool, "id" | "createdAt">): CustomTool {
        if (!tool.name || !/^[a-z_][a-z0-9_]*$/.test(tool.name)) {
            throw new Error("Tool name must be snake_case (e.g. my_tool_name)");
        }
        if (this.tools.find((t) => t.name === tool.name)) {
            throw new Error(`A tool named "${tool.name}" already exists`);
        }
        const newTool: CustomTool = {
            ...tool,
            id: `ct_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            createdAt: new Date().toISOString(),
        };
        this.tools.push(newTool);
        this.save();
        return newTool;
    }

    update(id: string, updates: Partial<Omit<CustomTool, "id" | "createdAt">>): CustomTool {
        const idx = this.tools.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error(`Tool not found: ${id}`);
        this.tools[idx] = { ...this.tools[idx]!, ...updates };
        this.save();
        return this.tools[idx]!;
    }

    delete(id: string): void {
        const idx = this.tools.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error(`Tool not found: ${id}`);
        this.tools.splice(idx, 1);
        this.save();
    }

    async run(toolName: string, args: Record<string, any>): Promise<any> {
        const tool = this.tools.find((t) => t.name === toolName);
        if (!tool) return { error: `Custom tool not found: ${toolName}` };

        const logs: string[] = [];
        const sandbox: any = {
            args,
            console: {
                log: (...a: any[]) => logs.push(a.map(String).join(" ")),
                error: (...a: any[]) => logs.push("[ERROR] " + a.map(String).join(" ")),
                warn: (...a: any[]) => logs.push("[WARN] " + a.map(String).join(" ")),
            },
            result: undefined,
            JSON: { parse: JSON.parse, stringify: JSON.stringify },
            Math,
            Date,
            parseInt,
            parseFloat,
            isNaN,
            String,
            Number,
            Boolean,
            Array,
            Object,
        };

        try {
            const script = new vm.Script(
                `(async function(args, console) { let result; ${tool.code}\n return result; })(args, console)`
            );
            const ctx = vm.createContext(sandbox);
            const returnValue = await script.runInContext(ctx, { timeout: 5000 });
            return {
                success: true,
                output: returnValue,
                logs,
                toolName,
            };
        } catch (e: any) {
            return { success: false, error: e.message, logs, toolName };
        }
    }

    getToolDefinitions() {
        return this.tools.map((tool) => ({
            type: "function",
            function: {
                name: tool.name,
                description: `[Custom] ${tool.description}`,
                parameters: {
                    type: "object",
                    properties: Object.fromEntries(
                        tool.parameters.map((p) => [p.name, { type: p.type, description: p.description }])
                    ),
                    required: tool.parameters.filter((p) => p.required).map((p) => p.name),
                },
            },
        }));
    }
}

export const customToolsEngine = new CustomToolsEngine();
