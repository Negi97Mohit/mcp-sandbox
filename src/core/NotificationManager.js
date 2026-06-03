let notifyCallback = null;
export function registerAdminNotifier(cb) {
    notifyCallback = cb;
}
export async function notifyAdmin(message) {
    console.log(`[ADMIN NOTIFICATION] ${message}`);
    if (notifyCallback) {
        try {
            await notifyCallback(message);
        }
        catch (err) {
            console.error("Failed to run registered admin notifier:", err);
        }
    }
}
//# sourceMappingURL=NotificationManager.js.map