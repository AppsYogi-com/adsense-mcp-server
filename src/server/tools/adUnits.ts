/**
 * Ad Units tools
 */

import { AdSenseClient } from '../../adsense/client.js';

/**
 * List all ad units
 */
export async function handleListAdUnits(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const client = await AdSenseClient.create(accountId);
    const adUnits = await client.listAdUnits(accountId);

    // Format ad units
    const formatAdUnit = (unit: any) => {
        const stateEmojiMap: Record<string, string> = {
            'ACTIVE': '✅',
            'ARCHIVED': '📦',
            'STATE_UNSPECIFIED': '❓',
        };
        const stateEmoji = stateEmojiMap[unit.state] || '❓';

        // Extract ad client ID and ad unit ID from name
        // Format: accounts/{pub-id}/adclients/{ad-client-id}/adunits/{ad-unit-id}
        const nameParts = unit.name.split('/');
        const adClientId = nameParts[3] || '';
        const adUnitId = nameParts[5] || '';

        return {
            displayName: unit.displayName,
            state: unit.state,
            stateEmoji,
            type: unit.contentAdsSettings?.type || 'UNKNOWN',
            size: unit.contentAdsSettings?.size || 'Auto',
            adClientId,
            adUnitId,
            name: unit.name,
            reportingDimensionId: unit.reportingDimensionId,
        };
    };

    // Group by state
    const byState = {
        active: adUnits.filter(u => u.state === 'ACTIVE'),
        archived: adUnits.filter(u => u.state === 'ARCHIVED'),
    };

    // Group by type
    const byType: Record<string, any[]> = {};
    for (const unit of adUnits) {
        const type = unit.contentAdsSettings?.type || 'UNKNOWN';
        if (!byType[type]) {
            byType[type] = [];
        }
        byType[type].push(unit);
    }

    return {
        adUnits: adUnits.map(formatAdUnit),
        summary: {
            total: adUnits.length,
            active: byState.active.length,
            archived: byState.archived.length,
            byType: Object.fromEntries(
                Object.entries(byType).map(([type, units]) => [type, units.length])
            ),
        },
        typeDescriptions: {
            DISPLAY: 'Standard display ads (image, text, rich media)',
            FEED: 'In-feed ads that match your content style',
            ARTICLE: 'In-article ads for between paragraphs',
            MATCHED_CONTENT: 'Content recommendations with ads',
            LINK: 'Contextual link unit ads',
        },
    };
}

/**
 * Get ad code for an ad unit
 */
export async function handleGetAdCode(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const adClientId = args.adClientId as string;
    const adUnitId = args.adUnitId as string;

    if (!adClientId || !adUnitId) {
        throw new Error('adClientId and adUnitId are required');
    }

    const client = await AdSenseClient.create(accountId);
    const adCode = await client.getAdCode(adClientId, adUnitId, accountId);

    return {
        adCode,
        adClientId,
        adUnitId,
        instructions: [
            'Copy the ad code above',
            'Paste it into your website HTML where you want the ad to appear',
            'The ad code should be placed within the <body> tags',
            'Make sure to test the ad placement before publishing',
        ],
    };
}
