/**
 * AdSense API Client
 * 
 * Wraps the googleapis client with:
 * - Automatic authentication (OAuth or service account)
 * - Rate limiting with exponential backoff
 * - Response caching for performance
 * - Pagination handling
 */

import { google, adsense_v2 } from 'googleapis';
import { loadConfig } from '../auth/tokenStore.js';
import { createOAuthClient } from '../auth/oauth.js';
import { createServiceAccountClient } from '../auth/serviceAccount.js';
import { rateLimiter, withRetry } from './rateLimiter.js';
import { getCache, CacheTTL } from './cache.js';
import type {
    AdSenseAccount,
    AdSenseSite,
    AdSenseAlert,
    AdSensePolicyIssue,
    AdSensePayment,
    AdSenseAdClient,
    AdSenseAdUnit,
    ReportQuery,
    ReportResponse,
    EarningsSummary,
    EarningsPeriod,
} from '../types.js';

/**
 * AdSense API Client
 */
export class AdSenseClient {
    private adsense: adsense_v2.Adsense;
    private defaultAccountId?: string;

    private constructor(adsense: adsense_v2.Adsense, defaultAccountId?: string) {
        this.adsense = adsense;
        this.defaultAccountId = defaultAccountId;
    }

    /**
     * Create an authenticated AdSense client
     */
    static async create(accountIdOverride?: string): Promise<AdSenseClient> {
        const config = await loadConfig();

        let auth;
        if (config.authType === 'service-account') {
            auth = await createServiceAccountClient();
        } else {
            auth = await createOAuthClient();
        }

        const adsense = google.adsense({
            version: 'v2',
            auth,
        });

        const accountId = accountIdOverride || config.defaultAccountId;
        return new AdSenseClient(adsense, accountId);
    }

    /**
     * Get the account ID to use (explicit > default > first available)
     */
    private async resolveAccountId(explicitId?: string): Promise<string> {
        if (explicitId) {
            return explicitId.startsWith('accounts/') ? explicitId : `accounts/${explicitId}`;
        }

        if (this.defaultAccountId) {
            return this.defaultAccountId.startsWith('accounts/')
                ? this.defaultAccountId
                : `accounts/${this.defaultAccountId}`;
        }

        // Fall back to first available account
        const accounts = await this.listAccounts();
        if (accounts.length === 0) {
            throw new Error('No AdSense accounts found');
        }
        return accounts[0].name;
    }

    /**
     * Extract publisher ID from account name
     */
    private extractPubId(accountName: string): string {
        return accountName.replace('accounts/', '');
    }

    // ==================== Account Operations ====================

    /**
     * List all AdSense accounts
     */
    async listAccounts(): Promise<AdSenseAccount[]> {
        const cache = getCache();
        const cacheKey = 'accounts';
        const cached = cache.get<AdSenseAccount[]>(cacheKey, {});

        if (cached) {
            return cached;
        }

        await rateLimiter.throttle();
        const response = await withRetry(() =>
            this.adsense.accounts.list()
        );

        const accounts = (response.data.accounts || []) as AdSenseAccount[];
        cache.set(cacheKey, {}, accounts, CacheTTL.ACCOUNTS, 'global');

        return accounts;
    }

    /**
     * Get a specific account
     */
    async getAccount(accountId?: string): Promise<AdSenseAccount | null> {
        const resolvedId = await this.resolveAccountId(accountId);

        await rateLimiter.throttle();
        try {
            const response = await withRetry(() =>
                this.adsense.accounts.get({ name: resolvedId })
            );
            return response.data as AdSenseAccount;
        } catch {
            return null;
        }
    }

    // ==================== Sites Operations ====================

    /**
     * List all sites for an account
     */
    async listSites(accountId?: string): Promise<AdSenseSite[]> {
        const resolvedId = await this.resolveAccountId(accountId);
        const cache = getCache();
        const params = { accountId: resolvedId };
        const cached = cache.get<AdSenseSite[]>('sites', params);

        if (cached) {
            return cached;
        }

        await rateLimiter.throttle();
        const response = await withRetry(() =>
            this.adsense.accounts.sites.list({ parent: resolvedId })
        );

        const sites = (response.data.sites || []) as AdSenseSite[];
        cache.set('sites', params, sites, CacheTTL.SITES, this.extractPubId(resolvedId));

        return sites;
    }

    // ==================== Alerts Operations ====================

    /**
     * List alerts for an account
     */
    async listAlerts(accountId?: string): Promise<AdSenseAlert[]> {
        const resolvedId = await this.resolveAccountId(accountId);
        const cache = getCache();
        const params = { accountId: resolvedId };
        const cached = cache.get<AdSenseAlert[]>('alerts', params);

        if (cached) {
            return cached;
        }

        await rateLimiter.throttle();
        const response = await withRetry(() =>
            this.adsense.accounts.alerts.list({ parent: resolvedId })
        );

        const alerts = (response.data.alerts || []) as AdSenseAlert[];
        cache.set('alerts', params, alerts, CacheTTL.ALERTS, this.extractPubId(resolvedId));

        return alerts;
    }

    // ==================== Policy Issues Operations ====================

    /**
     * List policy issues for an account
     */
    async listPolicyIssues(accountId?: string): Promise<AdSensePolicyIssue[]> {
        const resolvedId = await this.resolveAccountId(accountId);
        const cache = getCache();
        const params = { accountId: resolvedId };
        const cached = cache.get<AdSensePolicyIssue[]>('policyIssues', params);

        if (cached) {
            return cached;
        }

        await rateLimiter.throttle();
        const response = await withRetry(() =>
            this.adsense.accounts.policyIssues.list({ parent: resolvedId })
        );

        const issues = (response.data.policyIssues || []) as AdSensePolicyIssue[];
        cache.set('policyIssues', params, issues, CacheTTL.POLICY_ISSUES, this.extractPubId(resolvedId));

        return issues;
    }

    // ==================== Payments Operations ====================

    /**
     * List payments for an account
     */
    async listPayments(accountId?: string): Promise<AdSensePayment[]> {
        const resolvedId = await this.resolveAccountId(accountId);
        const cache = getCache();
        const params = { accountId: resolvedId };
        const cached = cache.get<AdSensePayment[]>('payments', params);

        if (cached) {
            return cached;
        }

        await rateLimiter.throttle();
        const response = await withRetry(() =>
            this.adsense.accounts.payments.list({ parent: resolvedId })
        );

        const payments = (response.data.payments || []) as AdSensePayment[];
        cache.set('payments', params, payments, CacheTTL.PAYMENTS, this.extractPubId(resolvedId));

        return payments;
    }

    // ==================== Ad Client Operations ====================

    /**
     * List ad clients for an account
     */
    async listAdClients(accountId?: string): Promise<AdSenseAdClient[]> {
        const resolvedId = await this.resolveAccountId(accountId);

        await rateLimiter.throttle();
        const response = await withRetry(() =>
            this.adsense.accounts.adclients.list({ parent: resolvedId })
        );

        return (response.data.adClients || []) as AdSenseAdClient[];
    }

    // ==================== Ad Unit Operations ====================

    /**
     * List ad units for an account (across all ad clients)
     */
    async listAdUnits(accountId?: string): Promise<AdSenseAdUnit[]> {
        const resolvedId = await this.resolveAccountId(accountId);
        const cache = getCache();
        const params = { accountId: resolvedId };
        const cached = cache.get<AdSenseAdUnit[]>('adUnits', params);

        if (cached) {
            return cached;
        }

        // First get all ad clients
        const adClients = await this.listAdClients(accountId);
        const allAdUnits: AdSenseAdUnit[] = [];

        // Then get ad units for each client
        for (const client of adClients) {
            await rateLimiter.throttle();
            const response = await withRetry(() =>
                this.adsense.accounts.adclients.adunits.list({ parent: client.name })
            );
            allAdUnits.push(...((response.data.adUnits || []) as AdSenseAdUnit[]));
        }

        cache.set('adUnits', params, allAdUnits, CacheTTL.AD_UNITS, this.extractPubId(resolvedId));

        return allAdUnits;
    }

    /**
     * Get ad code for an ad unit
     */
    async getAdCode(adClientId: string, adUnitId: string, accountId?: string): Promise<string> {
        const resolvedId = await this.resolveAccountId(accountId);
        const adUnitName = `${resolvedId}/adclients/${adClientId}/adunits/${adUnitId}`;

        await rateLimiter.throttle();
        const response = await withRetry(() =>
            this.adsense.accounts.adclients.adunits.getAdcode({ name: adUnitName })
        );

        return response.data.adCode || '';
    }

    // ==================== Report Operations ====================

    /**
     * Generate a report
     */
    async generateReport(query: ReportQuery): Promise<ReportResponse> {
        const resolvedId = await this.resolveAccountId(query.accountId);
        const cache = getCache();

        // Determine appropriate TTL based on date range
        const ttl = this.getReportTTL(query.startDate, query.endDate);
        const cached = cache.get<ReportResponse>('report', { ...query, accountId: resolvedId });

        if (cached) {
            return cached;
        }

        await rateLimiter.throttle();

        // Build request parameters
        const params: any = {
            account: resolvedId,
            'dateRange': query.dateRange || 'CUSTOM',
            'startDate.year': parseInt(query.startDate.split('-')[0]),
            'startDate.month': parseInt(query.startDate.split('-')[1]),
            'startDate.day': parseInt(query.startDate.split('-')[2]),
            'endDate.year': parseInt(query.endDate.split('-')[0]),
            'endDate.month': parseInt(query.endDate.split('-')[1]),
            'endDate.day': parseInt(query.endDate.split('-')[2]),
        };

        // Add dimensions
        if (query.dimensions && query.dimensions.length > 0) {
            params.dimensions = query.dimensions;
        }

        // Add metrics (default to basic earnings metrics)
        params.metrics = query.metrics || [
            'ESTIMATED_EARNINGS',
            'IMPRESSIONS',
            'CLICKS',
            'PAGE_VIEWS',
            'PAGE_VIEWS_CTR',
            'PAGE_VIEWS_RPM',
        ];

        // Add ordering
        if (query.orderBy) {
            params.orderBy = query.orderBy.startsWith('-')
                ? `${query.orderBy.slice(1)} DESC`
                : `${query.orderBy} ASC`;
        }

        // Add limit
        if (query.limit) {
            params.limit = Math.min(query.limit, 100000);
        }

        const response = await withRetry(() =>
            this.adsense.accounts.reports.generate(params)
        );

        const report = response.data as ReportResponse;
        cache.set('report', { ...query, accountId: resolvedId }, report, ttl, this.extractPubId(resolvedId));

        return report;
    }

    /**
     * Generate a CSV report
     */
    async generateCsvReport(query: ReportQuery): Promise<string> {
        const resolvedId = await this.resolveAccountId(query.accountId);

        await rateLimiter.throttle();

        const params: any = {
            account: resolvedId,
            'dateRange': query.dateRange || 'CUSTOM',
            'startDate.year': parseInt(query.startDate.split('-')[0]),
            'startDate.month': parseInt(query.startDate.split('-')[1]),
            'startDate.day': parseInt(query.startDate.split('-')[2]),
            'endDate.year': parseInt(query.endDate.split('-')[0]),
            'endDate.month': parseInt(query.endDate.split('-')[1]),
            'endDate.day': parseInt(query.endDate.split('-')[2]),
        };

        if (query.dimensions) {
            params.dimensions = query.dimensions;
        }

        params.metrics = query.metrics || [
            'ESTIMATED_EARNINGS',
            'IMPRESSIONS',
            'CLICKS',
            'PAGE_VIEWS',
        ];

        const response = await withRetry(() =>
            this.adsense.accounts.reports.generateCsv(params)
        );

        // Response is a stream, convert to string
        return response.data as unknown as string;
    }

    /**
     * Get earnings summary (today, yesterday, last 7 days, this month, last month)
     */
    async getEarningsSummary(accountId?: string): Promise<EarningsSummary> {
        const resolvedId = await this.resolveAccountId(accountId);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        // Calculate date ranges
        const todayStr = formatDate(today);
        const yesterdayStr = formatDate(yesterday);

        const last7DaysStart = new Date(today);
        last7DaysStart.setDate(last7DaysStart.getDate() - 6);

        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        // Fetch reports for each period
        const [todayReport, yesterdayReport, last7DaysReport, thisMonthReport, lastMonthReport] =
            await Promise.all([
                this.generateReport({
                    accountId: resolvedId,
                    startDate: todayStr,
                    endDate: todayStr,
                }),
                this.generateReport({
                    accountId: resolvedId,
                    startDate: yesterdayStr,
                    endDate: yesterdayStr,
                }),
                this.generateReport({
                    accountId: resolvedId,
                    startDate: formatDate(last7DaysStart),
                    endDate: todayStr,
                }),
                this.generateReport({
                    accountId: resolvedId,
                    startDate: formatDate(thisMonthStart),
                    endDate: todayStr,
                }),
                this.generateReport({
                    accountId: resolvedId,
                    startDate: formatDate(lastMonthStart),
                    endDate: formatDate(lastMonthEnd),
                }),
            ]);

        return {
            today: this.extractEarningsPeriod(todayReport),
            yesterday: this.extractEarningsPeriod(yesterdayReport),
            last7Days: this.extractEarningsPeriod(last7DaysReport),
            thisMonth: this.extractEarningsPeriod(thisMonthReport),
            lastMonth: this.extractEarningsPeriod(lastMonthReport),
        };
    }

    /**
     * Extract earnings data from a report response
     */
    private extractEarningsPeriod(report: ReportResponse): EarningsPeriod {
        const totals = report.totals?.cells || report.rows?.[0]?.cells || [];
        const headers = report.headers || [];

        const getValue = (metricName: string): number => {
            const index = headers.findIndex(h => h.name === metricName);
            if (index >= 0 && totals[index]) {
                return parseFloat(totals[index].value) || 0;
            }
            return 0;
        };

        return {
            earnings: getValue('ESTIMATED_EARNINGS'),
            impressions: getValue('IMPRESSIONS'),
            clicks: getValue('CLICKS'),
            ctr: getValue('PAGE_VIEWS_CTR') || getValue('IMPRESSIONS_CTR'),
            rpm: getValue('PAGE_VIEWS_RPM') || getValue('IMPRESSIONS_RPM'),
            pageViews: getValue('PAGE_VIEWS'),
        };
    }

    /**
     * Determine appropriate cache TTL based on date range
     */
    private getReportTTL(startDate: string, endDate: string): number {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (endDate === today || startDate === today) {
            return CacheTTL.TODAY_EARNINGS;
        }

        if (endDate === yesterdayStr) {
            return CacheTTL.YESTERDAY_EARNINGS;
        }

        return CacheTTL.HISTORICAL_REPORT;
    }
}
