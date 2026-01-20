import * as fs from 'fs/promises';
import * as path from 'path';
import envPaths from 'env-paths';
import type { Config, StoredTokens } from '../types.js';

const paths = envPaths('adsense-mcp');

// Service name for keytar
const KEYTAR_SERVICE = 'adsense-mcp';
const KEYTAR_ACCOUNT = 'tokens';

/**
 * Get the configuration directory path
 */
export function getConfigDir(): string {
    return paths.config;
}

/**
 * Ensure the config directory exists
 */
async function ensureConfigDir(): Promise<void> {
    await fs.mkdir(paths.config, { recursive: true });
}

/**
 * Load configuration from disk
 */
export async function loadConfig(): Promise<Config> {
    await ensureConfigDir();
    const configPath = path.join(paths.config, 'config.json');

    try {
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content) as Config;
    } catch {
        // Return default config if file doesn't exist
        return {
            authType: 'oauth',
            scope: 'readonly',
        };
    }
}

/**
 * Save configuration to disk
 */
export async function saveConfig(config: Config): Promise<void> {
    await ensureConfigDir();
    const configPath = path.join(paths.config, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Load tokens from secure storage (keytar) or fallback to file
 */
export async function loadTokens(): Promise<StoredTokens | null> {
    // Try keytar first (secure OS keychain)
    try {
        const keytar = await import('keytar');
        const stored = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
        if (stored) {
            return JSON.parse(stored) as StoredTokens;
        }
    } catch {
        // Keytar not available, fall back to file
    }

    // Fallback to file storage
    await ensureConfigDir();
    const tokensPath = path.join(paths.config, 'tokens.json');

    try {
        const content = await fs.readFile(tokensPath, 'utf-8');
        return JSON.parse(content) as StoredTokens;
    } catch {
        return null;
    }
}

/**
 * Save tokens to secure storage (keytar) or fallback to file
 */
export async function saveTokens(tokens: StoredTokens): Promise<void> {
    const tokenString = JSON.stringify(tokens);

    // Try keytar first (secure OS keychain)
    try {
        const keytar = await import('keytar');
        await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, tokenString);
        return;
    } catch {
        // Keytar not available, fall back to file
    }

    // Fallback to file storage
    await ensureConfigDir();
    const tokensPath = path.join(paths.config, 'tokens.json');
    await fs.writeFile(tokensPath, tokenString, { mode: 0o600 });
}

/**
 * Delete stored tokens
 */
export async function deleteTokens(): Promise<void> {
    // Try keytar first
    try {
        const keytar = await import('keytar');
        await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
    } catch {
        // Ignore errors
    }

    // Also delete file if exists
    const tokensPath = path.join(paths.config, 'tokens.json');
    try {
        await fs.unlink(tokensPath);
    } catch {
        // Ignore errors
    }
}

/**
 * Get the cache database path
 */
export function getCachePath(): string {
    return path.join(paths.config, 'cache.sqlite');
}

/**
 * Get the logs directory
 */
export function getLogsDir(): string {
    return path.join(paths.config, 'logs');
}
