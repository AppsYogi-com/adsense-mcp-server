/**
 * CLI: doctor command
 */

import * as fs from 'fs';
import * as path from 'path';
import { createOAuthClient } from '../auth/oauth.js';
import { createServiceAccountClient } from '../auth/serviceAccount.js';
import { loadConfig, getConfigDir } from '../auth/tokenStore.js';
import { AdSenseClient } from '../adsense/client.js';

interface CheckResult {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
}

export async function runDoctor(): Promise<void> {
    console.log('🩺 AdSense MCP Server Health Check\n');

    const results: CheckResult[] = [];

    // Check 1: Config directory
    const configDir = path.join(process.env.HOME || '', '.config', 'adsense-mcp');
    if (fs.existsSync(configDir)) {
        results.push({
            name: 'Config Directory',
            status: 'pass',
            message: configDir,
        });
    } else {
        results.push({
            name: 'Config Directory',
            status: 'fail',
            message: 'Not found. Run `adsense-mcp init` first.',
        });
    }

    // Check 2: Credentials
    const credentialsPath = path.join(configDir, 'credentials.json');
    const serviceAccountPath = path.join(configDir, 'service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
        results.push({
            name: 'Authentication',
            status: 'pass',
            message: 'Service account configured',
        });
    } else if (fs.existsSync(credentialsPath)) {
        results.push({
            name: 'Authentication',
            status: 'pass',
            message: 'OAuth credentials configured',
        });
    } else {
        results.push({
            name: 'Authentication',
            status: 'fail',
            message: 'No credentials found. Run `adsense-mcp init` first.',
        });
    }

    // Check 3: API Access
    try {
        const config = await loadConfig();
        let authClient;
        if (config.authType === 'service-account') {
            authClient = await createServiceAccountClient();
        } else {
            authClient = await createOAuthClient();
        }
        if (authClient) {
            results.push({
                name: 'Auth Client',
                status: 'pass',
                message: 'Successfully created auth client',
            });
        } else {
            throw new Error('Auth client is null');
        }
    } catch (error: any) {
        results.push({
            name: 'Auth Client',
            status: 'fail',
            message: `Failed: ${error.message}`,
        });
    }

    // Check 4: AdSense API
    try {
        const client = await AdSenseClient.create();
        const accounts = await client.listAccounts();

        if (accounts.length > 0) {
            results.push({
                name: 'AdSense API',
                status: 'pass',
                message: `Found ${accounts.length} account(s)`,
            });

            // List accounts
            console.log('\n📊 AdSense Accounts:');
            for (const account of accounts) {
                const id = account.name.replace('accounts/', '');
                console.log(`   • ${id} - ${account.displayName || 'Unnamed'}`);
            }
        } else {
            results.push({
                name: 'AdSense API',
                status: 'warn',
                message: 'No accounts found',
            });
        }
    } catch (error: any) {
        results.push({
            name: 'AdSense API',
            status: 'fail',
            message: `Failed: ${error.message}`,
        });
    }

    // Check 5: Cache directory
    const cacheDir = path.join(configDir, 'cache');
    if (fs.existsSync(cacheDir)) {
        const cacheFiles = fs.readdirSync(cacheDir);
        results.push({
            name: 'Cache',
            status: 'pass',
            message: `${cacheFiles.length} cache file(s)`,
        });
    } else {
        results.push({
            name: 'Cache',
            status: 'pass',
            message: 'Not yet created (will be created on first use)',
        });
    }

    // Print results
    console.log('\n📋 Health Check Results:\n');

    let hasFailures = false;
    for (const result of results) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
        console.log(`${icon} ${result.name}: ${result.message}`);
        if (result.status === 'fail') {
            hasFailures = true;
        }
    }

    console.log('');

    if (hasFailures) {
        console.log('❌ Some checks failed. Please fix the issues above.\n');
        process.exit(1);
    } else {
        console.log('✅ All checks passed! Server is ready to use.\n');
        console.log('Add to Claude Desktop config:');
        console.log('');
        console.log(JSON.stringify({
            "mcpServers": {
                "adsense": {
                    "command": "npx",
                    "args": ["-y", "adsense-mcp", "run"]
                }
            }
        }, null, 2));
    }
}
