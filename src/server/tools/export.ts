/**
 * Export tools
 */

import { AdSenseClient } from '../../adsense/client.js';
import type { ReportDimension, ReportMetric } from '../../types.js';

/**
 * Export report as CSV
 */
export async function handleExportCsv(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const startDate = args.startDate as string;
    const endDate = args.endDate as string;

    if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required');
    }

    const client = await AdSenseClient.create(accountId);

    // Try to get CSV directly from API
    try {
        const csvData = await client.generateCsvReport({
            accountId,
            startDate,
            endDate,
            dimensions: (args.dimensions as ReportDimension[]) || undefined,
            metrics: (args.metrics as ReportMetric[]) || undefined,
        });

        return {
            format: 'csv',
            dateRange: { start: startDate, end: endDate },
            data: csvData,
        };
    } catch {
        // Fall back to generating CSV from JSON report
        const report = await client.generateReport({
            accountId,
            startDate,
            endDate,
            dimensions: (args.dimensions as ReportDimension[]) || undefined,
            metrics: (args.metrics as ReportMetric[]) || undefined,
            limit: 10000,
        });

        // Convert to CSV
        const headers = report.headers?.map(h => h.name) || [];
        const rows = report.rows || [];

        const csvLines = [
            headers.join(','),
            ...rows.map(row =>
                row.cells.map(cell => {
                    // Escape values that contain commas or quotes
                    const value = cell.value;
                    if (value.includes(',') || value.includes('"')) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            ),
        ];

        return {
            format: 'csv',
            dateRange: { start: startDate, end: endDate },
            data: csvLines.join('\n'),
            rowCount: rows.length,
        };
    }
}
