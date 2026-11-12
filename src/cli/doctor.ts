/**
 * CLI: doctor command
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, loadTokens, getConfigDir, getCachePath } from '../auth/tokenStore.js';
import { AdSenseClient } from '../adsense/client.js';
import type { Config } from '../types.js';

interface CheckResult {
    name: string;
    status: 'pass' | 'fail' | 'warn' | 'skip';
    message: string;
}

// `init` also writes the OAuth client here before the browser sign-in starts.
// It only reflects the last attempt, not a completed sign-in.
const INIT_CREDENTIALS_PATH = path.join(process.env.HOME || '', '.config', 'adsense-mcp', 'credentials.json');

export async function runDoctor(): Promise<void> {
    console.log('🩺 AdSense MCP Server Health Check\n');

    const results: CheckResult[] = [];
    const configDir = getConfigDir();
    const configPath = path.join(configDir, 'config.json');

    // Check 1: Saved config (written by `init` only after a successful sign-in)
    let config: Config | null = null;
    if (!fs.existsSync(configPath)) {
        results.push({
            name: 'Config',
            status: 'fail',
            message: `Not found at ${configPath}. Run \`adsense-mcp init\` and finish the browser sign-in.`,
        });
    } else {
        config = await loadConfig();
        results.push(checkConfig(config, configPath));

        const stale = checkStaleInit(config, configPath);
        if (stale) results.push(stale);
    }

    // Check 2: Tokens (OAuth only)
    if (config?.authType === 'oauth') {
        const tokens = await loadTokens();
        if (!tokens?.accessToken) {
            results.push({
                name: 'Tokens',
                status: 'fail',
                message: 'No saved sign-in found. Run `adsense-mcp init` and finish the browser sign-in.',
            });
        } else if (!tokens.refreshToken) {
            results.push({
                name: 'Tokens',
                status: 'warn',
                message: 'No refresh token saved, so access will stop working within an hour. Run `adsense-mcp init` again.',
            });
        } else {
            results.push({ name: 'Tokens', status: 'pass', message: 'Sign-in saved (with refresh token)' });
        }
    }

    // Check 3: AdSense API (only meaningful once config and tokens are in place)
    if (results.some((r) => r.status === 'fail')) {
        results.push({ name: 'AdSense API', status: 'skip', message: 'Skipped. Fix the issues above first.' });
    } else {
        try {
            const client = await AdSenseClient.create();
            const accounts = await client.listAccounts();

            if (accounts.length > 0) {
                results.push({
                    name: 'AdSense API',
                    status: 'pass',
                    message: `Found ${accounts.length} account(s)`,
                });

                console.log('📊 AdSense Accounts:');
                for (const account of accounts) {
                    const id = account.name.replace('accounts/', '');
                    console.log(`   • ${id} - ${account.displayName || 'Unnamed'}`);
                }
                console.log('');
            } else {
                results.push({
                    name: 'AdSense API',
                    status: 'warn',
                    message: 'Connected, but no AdSense accounts found for this Google account',
                });
            }
        } catch (error: any) {
            const hint = apiErrorHint(error.message) || (config?.authType === 'service-account'
                ? '\n   → Service accounts only work for AdSense for Platforms accounts that Google has linked to this service account. ' +
                  'For a regular AdSense account, run `adsense-mcp init` without --service-account to use OAuth.'
                : '');
            results.push({
                name: 'AdSense API',
                status: 'fail',
                message: `Failed: ${error.message}${hint}`,
            });
        }
    }

    // Check 4: Cache
    const cachePath = getCachePath();
    if (fs.existsSync(cachePath)) {
        const sizeKb = Math.round(fs.statSync(cachePath).size / 1024);
        results.push({ name: 'Cache', status: 'pass', message: `${cachePath} (${sizeKb} KB)` });
    } else {
        results.push({ name: 'Cache', status: 'pass', message: 'Not yet created (will be created on first use)' });
    }

    // Print results
    console.log('📋 Health Check Results:\n');

    const icons = { pass: '✅', warn: '⚠️ ', fail: '❌', skip: '⏭️ ' } as const;
    for (const result of results) {
        console.log(`${icons[result.status]} ${result.name}: ${result.message}`);
    }
    console.log('');

    if (results.some((r) => r.status === 'fail')) {
        console.log('❌ Some checks failed. Please fix the issues above.\n');
        process.exit(1);
    }

    console.log('✅ All checks passed! Server is ready to use.\n');
    console.log('Add to your MCP client config (e.g. Claude Desktop):\n');
    console.log(JSON.stringify({
        mcpServers: {
            adsense: {
                command: 'npx',
                args: ['-y', '@appsyogi/adsense-mcp-server', 'run'],
            },
        },
    }, null, 2));
    console.log('\nOr, to run this exact install with this exact Node.js version:\n');
    console.log(JSON.stringify({
        mcpServers: {
            adsense: {
                command: process.execPath,
                args: [process.argv[1], 'run'],
            },
        },
    }, null, 2));
    console.log('');
}

function checkConfig(config: Config, configPath: string): CheckResult {
    const savedAt = fs.statSync(configPath).mtime.toLocaleString();

    if (config.authType === 'service-account') {
        if (!config.serviceAccountPath || !fs.existsSync(config.serviceAccountPath)) {
            return {
                name: 'Config',
                status: 'fail',
                message: 'Service account key file is missing. Run `adsense-mcp init --service-account <path>`.',
            };
        }
        return { name: 'Config', status: 'pass', message: `Service account (saved ${savedAt})` };
    }

    if (!config.clientId || !config.clientSecret) {
        return {
            name: 'Config',
            status: 'fail',
            message: 'OAuth Client ID or Secret missing. Run `adsense-mcp init`.',
        };
    }
    if (!config.clientId.endsWith('.apps.googleusercontent.com')) {
        return {
            name: 'Config',
            status: 'fail',
            message: 'Saved Client ID is not a valid OAuth Client ID (Client ID and Secret may be swapped). Run `adsense-mcp init`.',
        };
    }
    return {
        name: 'Config',
        status: 'pass',
        message: `OAuth client ${maskClientId(config.clientId)} (saved ${savedAt})`,
    };
}

/**
 * Detect an `init` that started with a different OAuth client but never finished sign-in,
 * which leaves an older client in the saved config.
 */
function checkStaleInit(config: Config, configPath: string): CheckResult | null {
    if (config.authType !== 'oauth' || !fs.existsSync(INIT_CREDENTIALS_PATH)) return null;

    try {
        const lastInit = JSON.parse(fs.readFileSync(INIT_CREDENTIALS_PATH, 'utf-8'))?.installed;
        const lastInitAt = fs.statSync(INIT_CREDENTIALS_PATH).mtime;
        const configAt = fs.statSync(configPath).mtime;

        if (lastInit?.client_id && lastInit.client_id !== config.clientId && lastInitAt > configAt) {
            return {
                name: 'Last init',
                status: 'warn',
                message: `Started ${lastInitAt.toLocaleString()} with OAuth client ${maskClientId(lastInit.client_id)} ` +
                    'but did not finish sign-in, so the older saved client is still in use. ' +
                    'Run `adsense-mcp init` again and complete the browser sign-in.',
            };
        }
    } catch {
        // Unreadable file: nothing useful to report
    }
    return null;
}

function apiErrorHint(message: string): string {
    if (message.includes('invalid_client')) {
        return '\n   → Google does not recognize the saved OAuth client (deleted, or ID/Secret mismatch). Run `adsense-mcp init` again.';
    }
    if (message.includes('invalid_grant')) {
        return '\n   → The saved sign-in expired or was revoked. Apps in "Testing" mode get refresh tokens that expire after 7 days. Run `adsense-mcp init` again.';
    }
    if (message.includes('NODE_MODULE_VERSION')) {
        return '\n   → Native modules were built for a different Node.js version. Run `npm rebuild better-sqlite3 keytar`.';
    }
    if (message.includes('accessNotConfigured') || message.includes('has not been used in project')) {
        return '\n   → Enable the "AdSense Management API" in your Google Cloud project.';
    }
    return '';
}

function maskClientId(clientId: string): string {
    const short = clientId.replace('.apps.googleusercontent.com', '');
    return short.length > 16 ? `${short.slice(0, 12)}…${short.slice(-4)}` : short;
}
