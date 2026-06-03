export declare const CONFIG: {
    OPENROUTER_API_KEY: string;
    DISCORD_TOKEN: string;
    NETLIFY_TOKEN: string;
    ALLOWED_USER_ID: string | undefined;
    MODEL_NAME: string;
    GITHUB_TOKEN: string;
    /** Default repo for GitHub tools when not specified by user (owner/repo) */
    GITHUB_DEFAULT_REPO: string;
    /** Get keys at https://cloud.langfuse.com — EU region available */
    LANGFUSE_SECRET_KEY: string;
    LANGFUSE_PUBLIC_KEY: string;
    LANGFUSE_HOST: string;
    SERVICE_KEY_PATH: string;
};
export declare function reloadConfig(): void;
//# sourceMappingURL=env.d.ts.map