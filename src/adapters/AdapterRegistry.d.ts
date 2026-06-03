import { EventEmitter } from "events";
import { type BaseAdapter } from "./BaseAdapter.js";
declare class AdapterRegistry extends EventEmitter {
    private adapters;
    private configPath;
    constructor();
    register(adapter: BaseAdapter): void;
    getAll(): BaseAdapter[];
    getById(id: string): BaseAdapter | undefined;
    startAdapter(id: string): Promise<void>;
    stopAdapter(id: string): Promise<void>;
    private loadConfigs;
    private saveConfigs;
}
export declare const adapterRegistry: AdapterRegistry;
export { type BaseAdapter };
//# sourceMappingURL=AdapterRegistry.d.ts.map