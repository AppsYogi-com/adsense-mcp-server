/**
 * CLI: init command
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { OAuth2Client } from 'google-auth-library';
import { saveTokens, saveConfig, getConfigDir } from '../auth/tokenStore.js';
import { ADSENSE_SCOPES } from '../types.js';

interface InitOptions {
    clientId?: string;
    clientSecret?: string;
    serviceAccount?: string;
}

export async function runInit(options: InitOptions): Promise<void> {
    console.log('🚀 AdSense MCP Server Setup\n');

    // Check for service account
    if (options.serviceAccount) {
        await setupServiceAccount(options.serviceAccount);
        return;
    }

    // OAuth flow
    const clientId = options.clientId || await prompt('Enter your OAuth Client ID: ');
    const clientSecret = options.clientSecret || await prompt('Enter your OAuth Client Secret: ');

    if (!clientId || !clientSecret) {
        console.error('❌ Client ID and Client Secret are required');
        console.log('\nTo create OAuth credentials:');
        console.log('1. Go to https://console.cloud.google.com/apis/credentials');
        console.log('2. Create an OAuth 2.0 Client ID (Desktop app)');
        console.log('3. Enable the AdSense Management API');
        process.exit(1);
    }

    // Save credentials
    const configDir = path.join(process.env.HOME || '', '.config', 'adsense-mcp');
    fs.mkdirSync(configDir, { recursive: true });

    const credentialsPath = path.join(configDir, 'credentials.json');
    fs.writeFileSync(credentialsPath, JSON.stringify({
        installed: {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: ['http://localhost:3000/oauth/callback', 'urn:ietf:wg:oauth:2.0:oob'],
        },
    }, null, 2));

    console.log(`✅ Credentials saved to ${credentialsPath}\n`);

    // Start OAuth flow
    await performOAuthFlow(clientId, clientSecret);
}

async function setupServiceAccount(keyPath: string): Promise<void> {
    console.log('Setting up service account authentication...\n');

    if (!fs.existsSync(keyPath)) {
        console.error(`❌ Service account key file not found: ${keyPath}`);
        process.exit(1);
    }

    try {
        const keyContent = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));

        if (!keyContent.client_email || !keyContent.private_key) {
            throw new Error('Invalid service account key file');
        }

        const configDir = path.join(process.env.HOME || '', '.config', 'adsense-mcp');
        fs.mkdirSync(configDir, { recursive: true });

        const destPath = path.join(configDir, 'service-account.json');
        fs.copyFileSync(keyPath, destPath);

        console.log(`✅ Service account key saved to ${destPath}`);
        console.log(`📧 Service account: ${keyContent.client_email}\n`);
        console.log('⚠️  Important: Make sure this service account has been granted');
        console.log('   access to your AdSense account via domain-wide delegation.\n');
        console.log('Run `adsense-mcp doctor` to verify the setup.');
    } catch (error: any) {
        console.error(`❌ Failed to setup service account: ${error.message}`);
        process.exit(1);
    }
}

async function performOAuthFlow(clientId: string, clientSecret: string): Promise<void> {
    const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
    );

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ADSENSE_SCOPES.readonly,
        prompt: 'consent',
    });

    console.log('📋 Open this URL in your browser to authorize:\n');
    console.log(authUrl);
    console.log('\n');

    const code = await prompt('Enter the authorization code: ');

    try {
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token) {
            throw new Error('No access token received');
        }

        // Save config
        await saveConfig({
            authType: 'oauth',
            clientId,
            clientSecret,
            scope: 'readonly',
        });

        // Save tokens securely
        await saveTokens({
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token ?? undefined,
            expiryDate: tokens.expiry_date ?? undefined,
        });

        console.log('\n✅ Authentication successful!');
        console.log('🔐 Tokens saved securely\n');
        console.log('Run `adsense-mcp doctor` to verify the setup.');
    } catch (error: any) {
        console.error(`\n❌ Authentication failed: ${error.message}`);
        process.exit(1);
    }
}

function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
