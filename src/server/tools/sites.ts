/**
 * Sites tools
 */

import { AdSenseClient } from '../../adsense/client.js';

/**
 * List all sites with their approval status
 */
export async function handleListSites(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const client = await AdSenseClient.create(accountId);
    const sites = await client.listSites(accountId);

    // Group by status
    const byStatus = {
        ready: sites.filter(s => s.state === 'READY'),
        gettingReady: sites.filter(s => s.state === 'GETTING_READY'),
        needsAttention: sites.filter(s => s.state === 'NEEDS_ATTENTION'),
        requiresReview: sites.filter(s => s.state === 'REQUIRES_REVIEW'),
    };

    // Format sites with status emoji
    const formatSite = (site: any) => {
        const statusEmojiMap: Record<string, string> = {
            'READY': '✅',
            'GETTING_READY': '⏳',
            'NEEDS_ATTENTION': '⚠️',
            'REQUIRES_REVIEW': '📝',
            'STATE_UNSPECIFIED': '❓',
        };
        const statusEmoji = statusEmojiMap[site.state] || '❓';

        return {
            domain: site.domain,
            status: site.state,
            statusEmoji,
            autoAdsEnabled: site.autoAdsEnabled || false,
            name: site.name,
        };
    };

    return {
        sites: sites.map(formatSite),
        summary: {
            total: sites.length,
            ready: byStatus.ready.length,
            gettingReady: byStatus.gettingReady.length,
            needsAttention: byStatus.needsAttention.length,
            requiresReview: byStatus.requiresReview.length,
        },
        statusDescriptions: {
            READY: 'Approved and serving ads',
            GETTING_READY: 'Under review by Google (may take 1-2 weeks)',
            NEEDS_ATTENTION: 'Issues to fix before approval',
            REQUIRES_REVIEW: 'Site needs review or is inactive',
        },
    };
}
