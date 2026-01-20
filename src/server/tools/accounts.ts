/**
 * Account tools
 */

import { AdSenseClient } from '../../adsense/client.js';

/**
 * List all AdSense accounts
 */
export async function handleListAccounts() {
    const client = await AdSenseClient.create();
    const accounts = await client.listAccounts();

    return {
        accounts: accounts.map(account => ({
            id: account.name.replace('accounts/', ''),
            name: account.name,
            displayName: account.displayName || 'Unnamed Account',
            timeZone: account.timeZone?.id || 'Unknown',
            createTime: account.createTime,
            premium: account.premium || false,
        })),
        total: accounts.length,
    };
}
