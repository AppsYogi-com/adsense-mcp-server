/**
 * MCP Tools - Registration and dispatch
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { handleListAccounts } from './accounts.js';
import {
    handleEarningsSummary,
    handleGenerateReport,
    handleComparePeriods,
} from './reports.js';
import { handleListSites } from './sites.js';
import { handleListAlerts, handleListPolicyIssues } from './alerts.js';
import { handleListPayments } from './payments.js';
import { handleListAdUnits, handleGetAdCode } from './adUnits.js';
import { handleExportCsv } from './export.js';

const REPORT_DIMENSIONS = [
    'DATE',
    'WEEK',
    'MONTH',
    'DOMAIN_NAME',
    'DOMAIN_CODE',
    'PAGE_URL',
    'AD_UNIT_NAME',
    'AD_UNIT_ID',
    'COUNTRY_NAME',
    'COUNTRY_CODE',
    'PLATFORM_TYPE_CODE',
    'PLATFORM_TYPE_NAME',
    'CONTENT_PLATFORM_CODE',
    'CONTENT_PLATFORM_NAME',
    'TRAFFIC_SOURCE_CODE',
    'TRAFFIC_SOURCE_NAME',
    'CUSTOM_CHANNEL_ID',
    'CUSTOM_CHANNEL_NAME',
    'OS_TYPE_CODE',
    'OS_TYPE_NAME',
    'BROWSER_TYPE_CODE',
    'BROWSER_TYPE_NAME',
    'AD_FORMAT_CODE',
    'AD_FORMAT_NAME',
    'AD_PLACEMENT_CODE',
    'AD_PLACEMENT_NAME',
];

const REPORT_METRICS = [
    'ESTIMATED_EARNINGS',
    'TOTAL_EARNINGS',
    'IMPRESSIONS',
    'CLICKS',
    'PAGE_VIEWS',
    'PAGE_VIEWS_CTR',
    'PAGE_VIEWS_RPM',
    'AD_REQUESTS',
    'MATCHED_AD_REQUESTS',
    'AD_REQUESTS_COVERAGE',
    'AD_REQUESTS_CTR',
    'AD_REQUESTS_RPM',
    'IMPRESSIONS_CTR',
    'IMPRESSIONS_RPM',
    'COST_PER_CLICK',
    'ACTIVE_VIEW_MEASURABILITY',
    'ACTIVE_VIEW_VIEWABILITY',
    'ACTIVE_VIEW_TIME',
];

/**
 * Register all available tools
 */
export function registerTools(): Tool[] {
    return [
        // Account tools
        {
            name: 'adsense_list_accounts',
            description: 'List all AdSense accounts you have access to',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },

        // Report tools
        {
            name: 'adsense_earnings_summary',
            description: 'Get a quick earnings summary (today, yesterday, last 7 days, this month, last month)',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID (e.g., pub-1234567890123456). Uses default if not specified.',
                    },
                },
                required: [],
            },
        },
        {
            name: 'adsense_generate_report',
            description: 'Generate a detailed AdSense performance report with custom dimensions and metrics',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID. Uses default if not specified.',
                    },
                    startDate: {
                        type: 'string',
                        description: 'Start date (YYYY-MM-DD). Defaults to 7 days ago.',
                    },
                    endDate: {
                        type: 'string',
                        description: 'End date (YYYY-MM-DD). Defaults to yesterday.',
                    },
                    dimensions: {
                        type: 'array',
                        items: { type: 'string', enum: REPORT_DIMENSIONS },
                        description: 'Dimensions to group by. For country/platform reports use COUNTRY_NAME or COUNTRY_CODE with PLATFORM_TYPE_CODE or PLATFORM_TYPE_NAME. For custom channel reports use CUSTOM_CHANNEL_NAME or CUSTOM_CHANNEL_ID.',
                    },
                    metrics: {
                        type: 'array',
                        items: { type: 'string', enum: REPORT_METRICS },
                        description: 'Metrics to include, such as ESTIMATED_EARNINGS, IMPRESSIONS, CLICKS, PAGE_VIEWS, PAGE_VIEWS_RPM, AD_REQUESTS, and AD_REQUESTS_COVERAGE.',
                    },
                    orderBy: {
                        type: 'string',
                        description: 'Dimension or metric to sort by. Prefix with - for descending or + for ascending, e.g. -ESTIMATED_EARNINGS.',
                    },
                    limit: {
                        type: 'number',
                        description: 'Max rows to return (default: 100, max: 10000)',
                    },
                },
                required: [],
            },
        },
        {
            name: 'adsense_compare_periods',
            description: 'Compare AdSense performance between two time periods',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID. Uses default if not specified.',
                    },
                    period1Start: {
                        type: 'string',
                        description: 'First period start date (YYYY-MM-DD)',
                    },
                    period1End: {
                        type: 'string',
                        description: 'First period end date (YYYY-MM-DD)',
                    },
                    period2Start: {
                        type: 'string',
                        description: 'Second period start date (YYYY-MM-DD)',
                    },
                    period2End: {
                        type: 'string',
                        description: 'Second period end date (YYYY-MM-DD)',
                    },
                    dimensions: {
                        type: 'array',
                        items: { type: 'string', enum: REPORT_DIMENSIONS },
                        description: 'Dimensions to group by for comparison, e.g. COUNTRY_NAME, PLATFORM_TYPE_CODE, or CUSTOM_CHANNEL_NAME.',
                    },
                },
                required: ['period1Start', 'period1End', 'period2Start', 'period2End'],
            },
        },

        // Sites tools
        {
            name: 'adsense_list_sites',
            description: 'List all sites and their AdSense approval status (READY, GETTING_READY, NEEDS_ATTENTION, REQUIRES_REVIEW)',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID. Uses default if not specified.',
                    },
                },
                required: [],
            },
        },

        // Alerts tools
        {
            name: 'adsense_list_alerts',
            description: 'List AdSense account alerts and warnings (INFO, WARNING, SEVERE)',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID. Uses default if not specified.',
                    },
                },
                required: [],
            },
        },
        {
            name: 'adsense_list_policy_issues',
            description: 'List policy issues and violations affecting your account (WARNED, AD_SERVING_RESTRICTED, AD_SERVING_DISABLED)',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID. Uses default if not specified.',
                    },
                },
                required: [],
            },
        },

        // Payments tools
        {
            name: 'adsense_list_payments',
            description: 'List payment history and pending earnings',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID. Uses default if not specified.',
                    },
                },
                required: [],
            },
        },

        // Ad units tools
        {
            name: 'adsense_list_ad_units',
            description: 'List all ad units across your ad clients',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID. Uses default if not specified.',
                    },
                },
                required: [],
            },
        },
        {
            name: 'adsense_get_ad_code',
            description: 'Get the HTML embed code for an ad unit',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID. Uses default if not specified.',
                    },
                    adClientId: {
                        type: 'string',
                        description: 'Ad client ID (e.g., ca-pub-1234567890123456)',
                    },
                    adUnitId: {
                        type: 'string',
                        description: 'Ad unit ID',
                    },
                },
                required: ['adClientId', 'adUnitId'],
            },
        },

        // Export tools
        {
            name: 'adsense_export_csv',
            description: 'Export AdSense report data as CSV format',
            inputSchema: {
                type: 'object',
                properties: {
                    accountId: {
                        type: 'string',
                        description: 'AdSense account ID. Uses default if not specified.',
                    },
                    startDate: {
                        type: 'string',
                        description: 'Start date (YYYY-MM-DD)',
                    },
                    endDate: {
                        type: 'string',
                        description: 'End date (YYYY-MM-DD)',
                    },
                    dimensions: {
                        type: 'array',
                        items: { type: 'string', enum: REPORT_DIMENSIONS },
                        description: 'Dimensions to include, e.g. COUNTRY_NAME, PLATFORM_TYPE_CODE, or CUSTOM_CHANNEL_NAME.',
                    },
                    metrics: {
                        type: 'array',
                        items: { type: 'string', enum: REPORT_METRICS },
                        description: 'Metrics to include.',
                    },
                },
                required: ['startDate', 'endDate'],
            },
        },
    ];
}

/**
 * Handle tool calls
 */
export async function handleToolCall(
    name: string,
    args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
        let result: any;

        switch (name) {
            case 'adsense_list_accounts':
                result = await handleListAccounts();
                break;
            case 'adsense_earnings_summary':
                result = await handleEarningsSummary(args);
                break;
            case 'adsense_generate_report':
                result = await handleGenerateReport(args);
                break;
            case 'adsense_compare_periods':
                result = await handleComparePeriods(args);
                break;
            case 'adsense_list_sites':
                result = await handleListSites(args);
                break;
            case 'adsense_list_alerts':
                result = await handleListAlerts(args);
                break;
            case 'adsense_list_policy_issues':
                result = await handleListPolicyIssues(args);
                break;
            case 'adsense_list_payments':
                result = await handleListPayments(args);
                break;
            case 'adsense_list_ad_units':
                result = await handleListAdUnits(args);
                break;
            case 'adsense_get_ad_code':
                result = await handleGetAdCode(args);
                break;
            case 'adsense_export_csv':
                result = await handleExportCsv(args);
                break;
            default:
                throw new Error(`Unknown tool: ${name}`);
        }

        return {
            content: [
                {
                    type: 'text',
                    text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error: any) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
        };
    }
}
