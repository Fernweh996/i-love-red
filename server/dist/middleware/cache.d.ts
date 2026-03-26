import NodeCache from 'node-cache';
export declare const searchCache: NodeCache;
export declare const estimateCache: NodeCache;
export declare const historyCache: NodeCache;
export declare const holdingsCache: NodeCache;
export declare const stockCache: NodeCache;
export declare const confirmedNavCache: NodeCache;
export declare function getCachedOrFetch<T>(cache: NodeCache, key: string, fetcher: () => Promise<T>): Promise<T>;
//# sourceMappingURL=cache.d.ts.map