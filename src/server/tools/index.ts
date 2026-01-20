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
                        items: { type: 'string' },
                        description: 'Dimensions to group by: DATE, WEEK, MONTH, DOMAIN_NAME, PAGE_URL, AD_UNIT_NAME, COUNTRY_NAME, PLATFORM_TYPE_CODE, TRAFFIC_SOURCE_CODE',
                    },
                    metrics: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Metrics to include: ESTIMATED_EARNINGS, IMPRESSIONS, CLICKS, PAGE_VIEWS, PAGE_VIEWS_CTR, PAGE_VIEWS_RPM, AD_REQUESTS, AD_REQUESTS_COVERAGE',
                    },
                    orderBy: {
                        type: 'string',
                        description: 'Metric to sort by (prefix with - for descending, e.g., -ESTIMATED_EARNINGS)',
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
                        items: { type: 'string' },
                        description: 'Dimensions to group by for comparison',
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
                        items: { type: 'string' },
                        description: 'Dimensions to include',
                    },
                    metrics: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Metrics to include',
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
