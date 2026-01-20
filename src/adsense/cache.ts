/**
 * SQLite cache for AdSense API responses
 * 
 * TTL Strategy:
 * - Today's earnings: 5 minutes (changes frequently)
 * - Yesterday's earnings: 1 hour (may update for spam filtering)
 * - Historical reports (>2 days): 24 hours (stable data)
 * - Account list: 24 hours (rarely changes)
 * - Sites list: 1 hour (status can change)
 * - Alerts: 15 minutes (important to catch quickly)
 * - Policy issues: 30 minutes (critical monitoring)
 * - Payments: 6 hours (rarely changes)
 */

import Database from 'better-sqlite3';
import { getCachePath } from '../auth/tokenStore.js';
import * as crypto from 'crypto';

// TTL values in milliseconds
export const CacheTTL = {
    TODAY_EARNINGS: 5 * 60 * 1000,        // 5 minutes
    YESTERDAY_EARNINGS: 60 * 60 * 1000,   // 1 hour
    HISTORICAL_REPORT: 24 * 60 * 60 * 1000, // 24 hours
    ACCOUNTS: 24 * 60 * 60 * 1000,        // 24 hours
    SITES: 60 * 60 * 1000,                // 1 hour
    ALERTS: 15 * 60 * 1000,               // 15 minutes
    POLICY_ISSUES: 30 * 60 * 1000,        // 30 minutes
    PAYMENTS: 6 * 60 * 60 * 1000,         // 6 hours
    AD_UNITS: 60 * 60 * 1000,             // 1 hour
} as const;

export class CacheManager {
    private db: Database.Database;

    constructor(dbPath?: string) {
        this.db = new Database(dbPath || getCachePath());
        this.initSchema();
    }

    /**
     * Initialize database schema
     */
    private initSchema(): void {
        this.db.exec(`
            -- Report cache with TTL
            CREATE TABLE IF NOT EXISTS report_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT UNIQUE NOT NULL,
                account_id TEXT NOT NULL,
                query_hash TEXT NOT NULL,
                response_data TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_report_cache_key ON report_cache(cache_key);
            CREATE INDEX IF NOT EXISTS idx_report_cache_expires ON report_cache(expires_at);

            -- Account info cache
            CREATE TABLE IF NOT EXISTS accounts_cache (
                account_id TEXT PRIMARY KEY,
                account_data TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            );

            -- Query history for analytics
            CREATE TABLE IF NOT EXISTS query_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT NOT NULL,
                tool_name TEXT NOT NULL,
                query_params TEXT,
                executed_at INTEGER NOT NULL,
                response_time_ms INTEGER
            );
        `);
    }

    /**
     * Generate a cache key from query parameters
     */
    private generateCacheKey(prefix: string, params: Record<string, any>): string {
        const hash = crypto
            .createHash('md5')
            .update(JSON.stringify(params))
            .digest('hex');
        return `${prefix}:${hash}`;
    }

    /**
     * Get cached data if not expired
     */
    get<T>(prefix: string, params: Record<string, any>): T | null {
        const cacheKey = this.generateCacheKey(prefix, params);
        const now = Date.now();

        const row = this.db
            .prepare('SELECT response_data, expires_at FROM report_cache WHERE cache_key = ?')
            .get(cacheKey) as { response_data: string; expires_at: number } | undefined;

        if (row && row.expires_at > now) {
            return JSON.parse(row.response_data) as T;
        }

        return null;
    }

    /**
     * Store data in cache
     */
    set(prefix: string, params: Record<string, any>, data: any, ttl: number, accountId: string): void {
        const cacheKey = this.generateCacheKey(prefix, params);
        const queryHash = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
        const now = Date.now();

        this.db
            .prepare(`
                INSERT OR REPLACE INTO report_cache 
                (cache_key, account_id, query_hash, response_data, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `)
            .run(cacheKey, accountId, queryHash, JSON.stringify(data), now, now + ttl);
    }

    /**
     * Clear expired cache entries
     */
    clearExpired(): number {
        const result = this.db
            .prepare('DELETE FROM report_cache WHERE expires_at < ?')
            .run(Date.now());
        return result.changes;
    }

    /**
     * Clear all cache for an account
     */
    clearAccount(accountId: string): number {
        const result = this.db
            .prepare('DELETE FROM report_cache WHERE account_id = ?')
            .run(accountId);
        return result.changes;
    }

    /**
     * Clear all cache
     */
    clearAll(): void {
        this.db.exec('DELETE FROM report_cache');
        this.db.exec('DELETE FROM accounts_cache');
    }

    /**
     * Record a query for analytics
     */
    recordQuery(accountId: string, toolName: string, params: any, responseTimeMs: number): void {
        this.db
            .prepare(`
                INSERT INTO query_history (account_id, tool_name, query_params, executed_at, response_time_ms)
                VALUES (?, ?, ?, ?, ?)
            `)
            .run(accountId, toolName, JSON.stringify(params), Date.now(), responseTimeMs);
    }

    /**
     * Get cache statistics
     */
    getStats(): { totalEntries: number; totalSize: number; expiredCount: number } {
        const now = Date.now();

        const totalEntries = (this.db
            .prepare('SELECT COUNT(*) as count FROM report_cache')
            .get() as { count: number }).count;

        const expiredCount = (this.db
            .prepare('SELECT COUNT(*) as count FROM report_cache WHERE expires_at < ?')
            .get(now) as { count: number }).count;

        // Estimate size (rough, based on response_data length)
        const sizeResult = this.db
            .prepare('SELECT SUM(LENGTH(response_data)) as size FROM report_cache')
            .get() as { size: number | null };

        return {
            totalEntries,
            totalSize: sizeResult.size || 0,
            expiredCount,
        };
    }

    /**
     * Close database connection
     */
    close(): void {
        this.db.close();
    }
}

// Singleton instance
let cacheInstance: CacheManager | null = null;

export function getCache(): CacheManager {
    if (!cacheInstance) {
        cacheInstance = new CacheManager();
    }
    return cacheInstance;
}

export function closeCache(): void {
    if (cacheInstance) {
        cacheInstance.close();
        cacheInstance = null;
    }
}
