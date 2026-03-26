"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmedNavCache = exports.stockCache = exports.holdingsCache = exports.historyCache = exports.estimateCache = exports.searchCache = void 0;
exports.getCachedOrFetch = getCachedOrFetch;
const node_cache_1 = __importDefault(require("node-cache"));
// Different cache instances with different TTLs
exports.searchCache = new node_cache_1.default({ stdTTL: 86400 }); // 24h
exports.estimateCache = new node_cache_1.default({ stdTTL: 15 }); // 15s
exports.historyCache = new node_cache_1.default({ stdTTL: 3600 }); // 1h
exports.holdingsCache = new node_cache_1.default({ stdTTL: 604800 }); // 7 days
exports.stockCache = new node_cache_1.default({ stdTTL: 5 }); // 5s
exports.confirmedNavCache = new node_cache_1.default({ stdTTL: 600 }); // 10min
function getCachedOrFetch(cache, key, fetcher) {
    const cached = cache.get(key);
    if (cached !== undefined) {
        return Promise.resolve(cached);
    }
    return fetcher().then((data) => {
        cache.set(key, data);
        return data;
    });
}
//# sourceMappingURL=cache.js.map