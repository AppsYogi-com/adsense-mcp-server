/**
 * Report tools
 */

import { AdSenseClient } from '../../adsense/client.js';
import type { ReportDimension, ReportMetric } from '../../types.js';

/**
 * Get earnings summary
 */
export async function handleEarningsSummary(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const client = await AdSenseClient.create(accountId);
    const summary = await client.getEarningsSummary(accountId);

    // Format currency
    const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
    const formatNumber = (value: number) => value.toLocaleString();
    const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

    return {
        summary: {
            today: {
                earnings: formatCurrency(summary.today.earnings),
                impressions: formatNumber(summary.today.impressions),
                clicks: formatNumber(summary.today.clicks),
                ctr: formatPercent(summary.today.ctr),
                rpm: formatCurrency(summary.today.rpm),
                pageViews: formatNumber(summary.today.pageViews),
            },
            yesterday: {
                earnings: formatCurrency(summary.yesterday.earnings),
                impressions: formatNumber(summary.yesterday.impressions),
                clicks: formatNumber(summary.yesterday.clicks),
                ctr: formatPercent(summary.yesterday.ctr),
                rpm: formatCurrency(summary.yesterday.rpm),
                pageViews: formatNumber(summary.yesterday.pageViews),
            },
            last7Days: {
                earnings: formatCurrency(summary.last7Days.earnings),
                impressions: formatNumber(summary.last7Days.impressions),
                clicks: formatNumber(summary.last7Days.clicks),
                ctr: formatPercent(summary.last7Days.ctr),
                rpm: formatCurrency(summary.last7Days.rpm),
                pageViews: formatNumber(summary.last7Days.pageViews),
            },
            thisMonth: {
                earnings: formatCurrency(summary.thisMonth.earnings),
                impressions: formatNumber(summary.thisMonth.impressions),
                clicks: formatNumber(summary.thisMonth.clicks),
                ctr: formatPercent(summary.thisMonth.ctr),
                rpm: formatCurrency(summary.thisMonth.rpm),
                pageViews: formatNumber(summary.thisMonth.pageViews),
            },
            lastMonth: {
                earnings: formatCurrency(summary.lastMonth.earnings),
                impressions: formatNumber(summary.lastMonth.impressions),
                clicks: formatNumber(summary.lastMonth.clicks),
                ctr: formatPercent(summary.lastMonth.ctr),
                rpm: formatCurrency(summary.lastMonth.rpm),
                pageViews: formatNumber(summary.lastMonth.pageViews),
            },
        },
        raw: summary,
        comparison: {
            vsYesterday: summary.yesterday.earnings > 0
                ? ((summary.today.earnings - summary.yesterday.earnings) / summary.yesterday.earnings * 100).toFixed(1) + '%'
                : 'N/A',
            vsLastMonth: summary.lastMonth.earnings > 0
                ? ((summary.thisMonth.earnings - summary.lastMonth.earnings) / summary.lastMonth.earnings * 100).toFixed(1) + '%'
                : 'N/A',
        },
    };
}

/**
 * Generate a detailed report
 */
export async function handleGenerateReport(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const client = await AdSenseClient.create(accountId);

    // Default date range: last 7 days
    const endDate = args.endDate as string || getYesterday();
    const startDate = args.startDate as string || get7DaysAgo();

    const report = await client.generateReport({
        accountId,
        startDate,
        endDate,
        dimensions: (args.dimensions as ReportDimension[]) || undefined,
        metrics: (args.metrics as ReportMetric[]) || undefined,
        orderBy: args.orderBy as string,
        limit: (args.limit as number) || 100,
    });

    // Transform to more readable format
    const headers = report.headers?.map(h => h.name) || [];
    const rows = report.rows?.map(row =>
        row.cells.reduce((acc, cell, i) => {
            acc[headers[i]] = cell.value;
            return acc;
        }, {} as Record<string, string>)
    ) || [];

    return {
        dateRange: {
            start: startDate,
            end: endDate,
        },
        headers,
        rows,
        totals: report.totals?.cells.reduce((acc, cell, i) => {
            acc[headers[i]] = cell.value;
            return acc;
        }, {} as Record<string, string>),
        totalRows: report.totalMatchedRows || rows.length.toString(),
    };
}

/**
 * Compare two time periods
 */
export async function handleComparePeriods(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const client = await AdSenseClient.create(accountId);

    const period1Start = args.period1Start as string;
    const period1End = args.period1End as string;
    const period2Start = args.period2Start as string;
    const period2End = args.period2End as string;

    if (!period1Start || !period1End || !period2Start || !period2End) {
        throw new Error('All period dates are required');
    }

    const dimensions = (args.dimensions as ReportDimension[]) || undefined;

    // Fetch both periods
    const [report1, report2] = await Promise.all([
        client.generateReport({
            accountId,
            startDate: period1Start,
            endDate: period1End,
            dimensions,
        }),
        client.generateReport({
            accountId,
            startDate: period2Start,
            endDate: period2End,
            dimensions,
        }),
    ]);

    // Extract totals
    const extractTotals = (report: any) => {
        const headers = report.headers?.map((h: any) => h.name) || [];
        const totals = report.totals?.cells || report.rows?.[0]?.cells || [];
        return headers.reduce((acc: any, header: string, i: number) => {
            acc[header] = parseFloat(totals[i]?.value) || 0;
            return acc;
        }, {});
    };

    const period1Totals = extractTotals(report1);
    const period2Totals = extractTotals(report2);

    // Calculate changes
    const changes: Record<string, { period1: number; period2: number; change: string; changePercent: string }> = {};

    for (const key of Object.keys(period1Totals)) {
        const val1 = period1Totals[key];
        const val2 = period2Totals[key] || 0;
        const diff = val1 - val2;
        const percent = val2 !== 0 ? (diff / val2) * 100 : 0;

        changes[key] = {
            period1: val1,
            period2: val2,
            change: diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2),
            changePercent: percent >= 0 ? `+${percent.toFixed(1)}%` : `${percent.toFixed(1)}%`,
        };
    }

    return {
        period1: {
            start: period1Start,
            end: period1End,
            totals: period1Totals,
        },
        period2: {
            start: period2Start,
            end: period2End,
            totals: period2Totals,
        },
        changes,
    };
}

// Helper functions
function getYesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

function get7DaysAgo(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
}
