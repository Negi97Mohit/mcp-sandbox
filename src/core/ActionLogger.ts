import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

export interface ActionLogEntry {
    id: string;                    // UUID
    timestamp: string;             // ISO 8601
    platform: string;              // 'discord' | 'desktop-ui' | etc
    userId: string;
    toolName: string;
    arguments: Record<string, any>;
    result: any;
    durationMs: number;
    status: 'success' | 'error';
    error?: string | undefined;
}

class ActionLogger {
    private logsDir: string;

    constructor() {
        const appName = "Gaki - Development Kit";
        const home = os.homedir();
        const userDataPath = process.platform === "win32"
            ? path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), appName)
            : process.platform === "darwin"
                ? path.join(home, "Library", "Application Support", appName)
                : path.join(home, ".config", appName);

        this.logsDir = path.join(userDataPath, "action_logs");
        this.ensureDirectory();
    }

    private ensureDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    private getLogFilePath(dateStr?: string): string {
        const date = dateStr || new Date().toISOString().split("T")[0] || "unknown";
        return path.join(this.logsDir, `actions_${date}.json`);
    }

    async log(entry: Omit<ActionLogEntry, "id" | "timestamp">): Promise<ActionLogEntry> {
        this.ensureDirectory();
        const fullEntry: ActionLogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...entry,
        };

        const filePath = this.getLogFilePath();
        let logs: ActionLogEntry[] = [];

        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, "utf-8");
                logs = JSON.parse(data);
            }
        } catch (err) {
            console.error("Failed to read action log file, starting fresh:", err);
        }

        logs.push(fullEntry);

        try {
            fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), "utf-8");
        } catch (err) {
            console.error("Failed to write action log entry:", err);
        }

        return fullEntry;
    }

    async getRecent(count: number = 50, filters?: { toolName?: string; userId?: string; platform?: string }): Promise<ActionLogEntry[]> {
        this.ensureDirectory();
        let allEntries: ActionLogEntry[] = [];

        try {
            const files = fs.readdirSync(this.logsDir)
                .filter(f => f.startsWith("actions_") && f.endsWith(".json"))
                .sort() // ascending by date string
                .reverse(); // descending (most recent first)

            for (const file of files) {
                if (allEntries.length >= count * 2) break; // load a reasonable buffer
                const filePath = path.join(this.logsDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as ActionLogEntry[];
                allEntries = allEntries.concat(data.reverse());
            }
        } catch (err) {
            console.error("Failed to read action logs:", err);
        }

        // Apply filters
        if (filters) {
            allEntries = allEntries.filter(entry => {
                if (filters.toolName && entry.toolName !== filters.toolName) return false;
                if (filters.userId && entry.userId !== filters.userId) return false;
                if (filters.platform && entry.platform !== filters.platform) return false;
                return true;
            });
        }

        return allEntries.slice(0, count);
    }

    async getById(id: string): Promise<ActionLogEntry | undefined> {
        this.ensureDirectory();
        try {
            const files = fs.readdirSync(this.logsDir)
                .filter(f => f.startsWith("actions_") && f.endsWith(".json"));

            for (const file of files) {
                const filePath = path.join(this.logsDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as ActionLogEntry[];
                const found = data.find(entry => entry.id === id);
                if (found) return found;
            }
        } catch (err) {
            console.error("Failed to find action by ID:", err);
        }
        return undefined;
    }
}

export const actionLogger = new ActionLogger();
