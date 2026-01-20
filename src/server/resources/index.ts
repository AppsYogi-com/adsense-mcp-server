/**
 * MCP Resources
 */

import { AdSenseClient } from '../../adsense/client.js';

/**
 * List available resources
 */
export async function handleListResources() {
    return {
        resources: [
            {
                uri: 'adsense://accounts',
                name: 'AdSense Accounts',
                description: 'List of all AdSense accounts you have access to',
                mimeType: 'application/json',
            },
        ],
    };
}

/**
 * Read a resource
 */
export async function handleReadResource(uri: string) {
    const url = new URL(uri);

    if (url.protocol !== 'adsense:') {
        throw new Error(`Unsupported protocol: ${url.protocol}`);
    }

    const path = url.pathname.replace(/^\/\//, '');

    // Handle different resource paths
    if (path === 'accounts') {
        const client = await AdSenseClient.create();
        const accounts = await client.listAccounts();

        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(accounts, null, 2),
                },
            ],
        };
    }

    // Handle accounts/{accountId}/sites
    const sitesMatch = path.match(/^accounts\/([^/]+)\/sites$/);
    if (sitesMatch) {
        const accountId = sitesMatch[1];
        const client = await AdSenseClient.create(accountId);
        const sites = await client.listSites(accountId);

        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(sites, null, 2),
                },
            ],
        };
    }

    // Handle accounts/{accountId}/adunits
    const adUnitsMatch = path.match(/^accounts\/([^/]+)\/adunits$/);
    if (adUnitsMatch) {
        const accountId = adUnitsMatch[1];
        const client = await AdSenseClient.create(accountId);
        const adUnits = await client.listAdUnits(accountId);

        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(adUnits, null, 2),
                },
            ],
        };
    }

    throw new Error(`Unknown resource: ${uri}`);
}
