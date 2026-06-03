type NotifyCallback = (msg: string) => Promise<void>;
export declare function registerAdminNotifier(cb: NotifyCallback): void;
export declare function notifyAdmin(message: string): Promise<void>;
export {};
//# sourceMappingURL=NotificationManager.d.ts.map