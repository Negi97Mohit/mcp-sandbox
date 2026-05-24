type NotifyCallback = (msg: string) => Promise<void>;
let notifyCallback: NotifyCallback | null = null;

export function registerAdminNotifier(cb: NotifyCallback) {
    notifyCallback = cb;
}

export async function notifyAdmin(message: string) {
    console.log(`[ADMIN NOTIFICATION] ${message}`);
    if (notifyCallback) {
        try {
            await notifyCallback(message);
        } catch (err) {
            console.error("Failed to run registered admin notifier:", err);
        }
    }
}
