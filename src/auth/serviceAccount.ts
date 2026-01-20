import { google } from 'googleapis';
import { loadConfig } from './tokenStore.js';
import { ADSENSE_SCOPES } from '../types.js';
import * as fs from 'fs/promises';

/**
 * Create an authenticated client using service account credentials
 */
export async function createServiceAccountClient() {
    const config = await loadConfig();

    if (config.authType !== 'service-account') {
        throw new Error('Service account not configured. Run `adsense-mcp init --service-account <path>` to set up.');
    }

    if (!config.serviceAccountPath) {
        throw new Error('Service account path not configured.');
    }

    // Read the service account key file
    const keyFileContent = await fs.readFile(config.serviceAccountPath, 'utf-8');
    const keyFile = JSON.parse(keyFileContent);

    // Create JWT client
    const auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: ADSENSE_SCOPES[config.scope],
    });

    return auth;
}
