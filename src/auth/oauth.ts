import { OAuth2Client } from 'google-auth-library';
import { loadConfig, loadTokens, saveTokens } from './tokenStore.js';
import { ADSENSE_SCOPES, type ScopeType } from '../types.js';

/**
 * Create an authenticated OAuth2 client
 */
export async function createOAuthClient(): Promise<OAuth2Client> {
    const config = await loadConfig();

    if (config.authType !== 'oauth') {
        throw new Error('OAuth not configured. Run `adsense-mcp init` to set up OAuth.');
    }

    const oauth2Client = new OAuth2Client({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
    });

    const tokens = await loadTokens();
    if (!tokens) {
        throw new Error('No tokens found. Run `adsense-mcp init` to authenticate.');
    }

    oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: tokens.expiryDate,
    });

    // Set up automatic token refresh
    oauth2Client.on('tokens', async (newTokens) => {
        await saveTokens({
            accessToken: newTokens.access_token || tokens.accessToken,
            refreshToken: newTokens.refresh_token || tokens.refreshToken,
            expiryDate: newTokens.expiry_date || Date.now() + 3600000,
        });
    });

    return oauth2Client;
}

/**
 * Get the required scopes for the current configuration
 */
export async function getScopes(): Promise<string[]> {
    const config = await loadConfig();
    return ADSENSE_SCOPES[config.scope];
}

/**
 * Get scopes by type
 */
export function getScopesByType(scopeType: ScopeType): string[] {
    return ADSENSE_SCOPES[scopeType];
}

/**
 * Check if the current scope supports a given feature
 */
export async function hasScope(requiredScope: ScopeType): Promise<boolean> {
    const config = await loadConfig();

    if (requiredScope === 'readonly') {
        return true; // readonly is always available
    }

    return config.scope === requiredScope;
}

/**
 * Get a helpful error message for scope upgrade
 */
export function getScopeUpgradeMessage(feature: string): string {
    return `The "${feature}" feature requires full scope access.\n` +
        'Note: This MCP server uses read-only scope by design for safety.';
}
