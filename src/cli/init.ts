/**
 * CLI: init command
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as http from 'http';
import type { AddressInfo } from 'net';
import { randomBytes } from 'crypto';
import open from 'open';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { saveTokens, saveConfig, getConfigDir } from '../auth/tokenStore.js';
import { ADSENSE_SCOPES } from '../types.js';

interface InitOptions {
    clientId?: string;
    clientSecret?: string;
    serviceAccount?: string;
    port?: string;
}

export async function runInit(options: InitOptions): Promise<void> {
    console.log('🚀 AdSense MCP Server Setup\n');

    // Check for service account
    if (options.serviceAccount) {
        await setupServiceAccount(options.serviceAccount);
        return;
    }

    // OAuth flow
    let clientId = options.clientId || await prompt('Enter your OAuth Client ID (ends with .apps.googleusercontent.com): ');
    let clientSecret = options.clientSecret || await prompt('Enter your OAuth Client Secret (usually starts with GOCSPX-): ');

    // Catch the common mix-up of pasting the secret and ID in the wrong order
    if (!isClientId(clientId) && isClientId(clientSecret)) {
        [clientId, clientSecret] = [clientSecret, clientId];
        console.log('ℹ️  Client ID and Client Secret looked swapped. Using them in the correct order.\n');
    }
    if (clientId && !isClientId(clientId)) {
        console.error('❌ That does not look like an OAuth Client ID (it should end with .apps.googleusercontent.com).');
        process.exit(1);
    }

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
            redirect_uris: ['http://127.0.0.1'],
        },
    }, null, 2));

    console.log(`✅ Credentials saved to ${credentialsPath}\n`);

    // Start OAuth flow
    const port = options.port ? Number(options.port) : 0;
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
        console.error(`❌ Invalid --port value: ${options.port}`);
        process.exit(1);
    }
    await performOAuthFlow(clientId, clientSecret, port);
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
        fs.chmodSync(destPath, 0o600);

        // Point the server at the key. This replaces any OAuth setup.
        await saveConfig({
            authType: 'service-account',
            serviceAccountPath: destPath,
            scope: 'readonly',
        });

        console.log(`✅ Service account key saved to ${destPath}`);
        console.log(`📧 Service account: ${keyContent.client_email}\n`);
        console.log('⚠️  Important: Regular AdSense accounts do not support service accounts.');
        console.log('   This only works for AdSense for Platforms accounts where Google has added');
        console.log('   this service account to your AdSense account (ask your account manager).');
        console.log('   Otherwise, run `adsense-mcp init` without --service-account to use OAuth.\n');
        console.log('Run `adsense-mcp doctor` to verify the setup.');
    } catch (error: any) {
        console.error(`❌ Failed to setup service account: ${error.message}`);
        process.exit(1);
    }
}

const AUTH_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * OAuth via the loopback redirect flow (http://127.0.0.1:<port>).
 * Google blocked the out-of-band (urn:ietf:wg:oauth:2.0:oob) flow, so we run a
 * short-lived local server to receive the authorization code. Desktop-app
 * OAuth clients accept any loopback port without registering it.
 */
async function performOAuthFlow(clientId: string, clientSecret: string, port = 0): Promise<void> {
    const server = http.createServer();
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => resolve());
    });
    const { port: boundPort } = server.address() as AddressInfo;
    const redirectUri = `http://127.0.0.1:${boundPort}`;

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { codeVerifier, codeChallenge } = await oauth2Client.generateCodeVerifierAsync();
    const state = randomBytes(16).toString('hex');

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ADSENSE_SCOPES.readonly,
        prompt: 'consent',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: CodeChallengeMethod.S256,
    });

    console.log('📋 Opening your browser to authorize. If it does not open, visit:\n');
    console.log(authUrl);
    console.log(`\n⏳ Waiting for Google to redirect to ${redirectUri} ...`);
    console.log('   (If Google shows "redirect_uri_mismatch", your OAuth client must be of type "Desktop app".)\n');

    // If the browser can't be launched (e.g. headless/SSH), the printed URL is enough.
    open(authUrl)
        .then((child) => child.on('error', () => { /* ignore spawn failure */ }))
        .catch(() => { /* ignore */ });

    try {
        const code = await waitForAuthCode(server, state);
        const { tokens } = await oauth2Client.getToken({ code, codeVerifier, redirect_uri: redirectUri });

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
    } finally {
        server.close();
    }
}

/**
 * Wait for Google's redirect to the loopback server and return the auth code.
 */
function waitForAuthCode(server: http.Server, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Timed out waiting for authorization (5 minutes). Run `adsense-mcp init` again.'));
        }, AUTH_TIMEOUT_MS);

        server.on('request', (req, res) => {
            const url = new URL(req.url || '/', 'http://127.0.0.1');
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');
            const state = url.searchParams.get('state');

            // Ignore unrelated requests (e.g. /favicon.ico)
            if (!code && !error) {
                res.writeHead(404).end();
                return;
            }

            const finish = (status: number, message: string) => {
                res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', Connection: 'close' });
                res.end(`<!doctype html><html><body style="font-family:system-ui;padding:2rem">` +
                    `<h2>${message}</h2><p>You can close this tab and return to the terminal.</p></body></html>`);
                clearTimeout(timer);
            };

            if (error) {
                finish(400, 'Authorization was not completed.');
                reject(new Error(`Google returned an error: ${error}`));
            } else if (state !== expectedState) {
                finish(400, 'Authorization failed: state mismatch.');
                reject(new Error('State mismatch in OAuth callback. Please try again.'));
            } else {
                finish(200, '✅ AdSense MCP is authorized.');
                resolve(code!);
            }
        });
    });
}

function isClientId(value: string): boolean {
    return value.endsWith('.apps.googleusercontent.com');
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
