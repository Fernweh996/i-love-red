import NodeCache from 'node-cache';

// Different cache instances with different TTLs
export const searchCache = new NodeCache({ stdTTL: 86400 });      // 24h
export const estimateCache = new NodeCache({ stdTTL: 15 });        // 15s
export const historyCache = new NodeCache({ stdTTL: 3600 });       // 1h
export const holdingsCache = new NodeCache({ stdTTL: 604800 });    // 7 days
export const stockCache = new NodeCache({ stdTTL: 5 });            // 5s
export const confirmedNavCache = new NodeCache({ stdTTL: 600 });   // 10min

export function getCachedOrFetch<T>(
  cache: NodeCache,
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  return fetcher().then((data) => {
    cache.set(key, data);
    return data;
  });
}
