import * as fs from "fs/promises";
import * as path from "path";

// Stats storage directory
const STATS_DIR = path.join(process.cwd(), "stats");

export interface DailyStats {
    date: string;
    messagesProcessed: number;
    toolCalls: Record<string, number>;
    totalToolCalls: number;
    errors: number;
    responseTimes: number[]; // Array of response times in ms
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
}

// In-memory cache of today's stats
let todayStats: DailyStats | null = null;
let todayDate: string | null = null;

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayDate(): string {
    return new Date().toISOString().split("T")[0]!;
}

/**
 * Get or initialize today's stats
 */
async function getTodayStats(): Promise<DailyStats> {
    const today = getTodayDate();

    // If cache is valid, return it
    if (todayStats && todayDate === today) {
        return todayStats;
    }

    // Try to load from file
    await fs.mkdir(STATS_DIR, { recursive: true });
    const filepath = path.join(STATS_DIR, `stats_${today}.json`);

    try {
        const content = await fs.readFile(filepath, "utf-8");
        todayStats = JSON.parse(content) as DailyStats;
        todayDate = today;
    } catch {
        // Initialize new stats for today
        todayStats = {
            date: today,
            messagesProcessed: 0,
            toolCalls: {},
            totalToolCalls: 0,
            errors: 0,
            responseTimes: [],
            avgResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0
        };
        todayDate = today;
    }

    return todayStats;
}

/**
 * Save today's stats to file
 */
async function saveTodayStats(): Promise<void> {
    if (!todayStats) return;

    await fs.mkdir(STATS_DIR, { recursive: true });
    const filepath = path.join(STATS_DIR, `stats_${todayStats.date}.json`);
    await fs.writeFile(filepath, JSON.stringify(todayStats, null, 2), "utf-8");
}

/**
 * Record a message being processed
 */
export async function recordMessage(): Promise<void> {
    const stats = await getTodayStats();
    stats.messagesProcessed++;
    await saveTodayStats();
}

/**
 * Record a tool call
 */
export async function recordToolCall(toolName: string): Promise<void> {
    const stats = await getTodayStats();
    stats.toolCalls[toolName] = (stats.toolCalls[toolName] || 0) + 1;
    stats.totalToolCalls++;
    await saveTodayStats();
}

/**
 * Record an error
 */
export async function recordError(): Promise<void> {
    const stats = await getTodayStats();
    stats.errors++;
    await saveTodayStats();
}

/**
 * Record a response time
 */
export async function recordResponseTime(timeMs: number): Promise<void> {
    const stats = await getTodayStats();
    stats.responseTimes.push(timeMs);

    // Update aggregates
    const times = stats.responseTimes;
    stats.avgResponseTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    stats.minResponseTime = Math.min(...times);
    stats.maxResponseTime = Math.max(...times);

    await saveTodayStats();
}

/**
 * Get stats for the last N days
 */
export async function getStatsHistory(days: number = 7): Promise<DailyStats[]> {
    await fs.mkdir(STATS_DIR, { recursive: true });

    const stats: DailyStats[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0]!;
        const filepath = path.join(STATS_DIR, `stats_${dateStr}.json`);

        try {
            const content = await fs.readFile(filepath, "utf-8");
            stats.push(JSON.parse(content) as DailyStats);
        } catch {
            // No stats for this day, add empty entry
            stats.push({
                date: dateStr,
                messagesProcessed: 0,
                toolCalls: {},
                totalToolCalls: 0,
                errors: 0,
                responseTimes: [],
                avgResponseTime: 0,
                minResponseTime: 0,
                maxResponseTime: 0
            });
        }
    }

    // Return in chronological order (oldest first)
    return stats.reverse();
}

/**
 * Get aggregated tool usage across all days
 */
export async function getToolUsageBreakdown(days: number = 7): Promise<Record<string, number>> {
    const history = await getStatsHistory(days);
    const breakdown: Record<string, number> = {};

    for (const day of history) {
        for (const [tool, count] of Object.entries(day.toolCalls)) {
            breakdown[tool] = (breakdown[tool] || 0) + count;
        }
    }

    return breakdown;
}

/**
 * Get aggregated model usage across all days (stub implementation)
 */
export async function getModelUsageBreakdown(days: number = 7): Promise<Record<string, number>> {
    return {};
}
