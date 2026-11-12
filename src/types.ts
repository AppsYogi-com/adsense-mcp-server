/**
 * AdSense MCP Server - Type Definitions
 */

// OAuth Scopes
export const ADSENSE_SCOPES: Record<string, string[]> = {
    readonly: ['https://www.googleapis.com/auth/adsense.readonly'],
    // Full scope available but NOT recommended for MCP use:
    // full: ['https://www.googleapis.com/auth/adsense'],
};

export type ScopeType = 'readonly';

// Configuration
export interface Config {
    authType: 'oauth' | 'service-account';
    clientId?: string;
    clientSecret?: string;
    serviceAccountPath?: string;
    defaultAccountId?: string;
    scope: ScopeType;
}

// Token storage
export interface StoredTokens {
    accessToken: string;
    refreshToken?: string;
    expiryDate?: number;
}

// AdSense Account
export interface AdSenseAccount {
    name: string; // Format: accounts/pub-XXXXXXXXXXXXXXXX
    displayName?: string;
    timeZone?: {
        id: string;
    };
    createTime?: string;
    premium?: boolean;
    pendingTasks?: string[];
}

// AdSense Site
export interface AdSenseSite {
    name: string;
    reportingDimensionId?: string;
    domain: string;
    state: 'REQUIRES_REVIEW' | 'GETTING_READY' | 'READY' | 'NEEDS_ATTENTION' | 'STATE_UNSPECIFIED';
    autoAdsEnabled?: boolean;
}

// AdSense Alert
export interface AdSenseAlert {
    name: string;
    severity: 'SEVERITY_UNSPECIFIED' | 'INFO' | 'WARNING' | 'SEVERE';
    message: string;
    type: string;
}

// AdSense Policy Issue
export interface AdSensePolicyIssue {
    name: string;
    site?: string;
    siteSection?: string;
    uri?: string;
    adRequestCount?: string;
    entityType?: 'ENTITY_TYPE_UNSPECIFIED' | 'SITE' | 'SITE_SECTION' | 'PAGE';
    action?: 'ENFORCEMENT_ACTION_UNSPECIFIED' | 'WARNED' | 'AD_SERVING_RESTRICTED' | 'AD_SERVING_DISABLED' | 'AD_SERVED_WITH_CLICK_CONFIRMATION' | 'AD_PERSONALIZATION_RESTRICTED';
    warningEscalationDate?: { year: number; month: number; day: number };
}

// AdSense Payment
export interface AdSensePayment {
    name: string;
    amount?: string;
    date?: { year: number; month: number; day: number };
}

// AdSense Ad Client
export interface AdSenseAdClient {
    name: string;
    reportingDimensionId?: string;
    productCode?: 'AFC' | 'AFG' | 'AFMC' | 'AFS' | 'AFV' | 'AFVH';
    state?: 'READY' | 'GETTING_READY' | 'REQUIRES_REVIEW' | 'STATE_UNSPECIFIED';
}

// AdSense Ad Unit
export interface AdSenseAdUnit {
    name: string;
    reportingDimensionId?: string;
    displayName: string;
    state: 'ACTIVE' | 'ARCHIVED' | 'STATE_UNSPECIFIED';
    contentAdsSettings?: {
        type?: 'DISPLAY' | 'FEED' | 'ARTICLE' | 'MATCHED_CONTENT' | 'LINK';
        size?: string;
    };
}

// Report Types
/**
 * All report dimensions supported by the AdSense Management API v2.
 * https://developers.google.com/adsense/management/reference/rest/v2/Dimension
 */
export const REPORT_DIMENSIONS = [
    'DATE',
    'WEEK',
    'MONTH',
    'ACCOUNT_NAME',
    'AD_CLIENT_ID',
    'HOSTED_AD_CLIENT_ID',
    'PRODUCT_NAME',
    'PRODUCT_CODE',
    'AD_UNIT_NAME',
    'AD_UNIT_ID',
    'AD_UNIT_SIZE_NAME',
    'AD_UNIT_SIZE_CODE',
    'CUSTOM_CHANNEL_NAME',
    'CUSTOM_CHANNEL_ID',
    'HOSTED_CUSTOM_CHANNEL_ID',
    'OWNED_SITE_DOMAIN_NAME',
    'OWNED_SITE_ID',
    'PAGE_URL',
    'URL_CHANNEL_NAME',
    'URL_CHANNEL_ID',
    'BUYER_NETWORK_NAME',
    'BUYER_NETWORK_ID',
    'BID_TYPE_NAME',
    'BID_TYPE_CODE',
    'CREATIVE_SIZE_NAME',
    'CREATIVE_SIZE_CODE',
    'DOMAIN_NAME',
    'DOMAIN_CODE',
    'COUNTRY_NAME',
    'COUNTRY_CODE',
    'PLATFORM_TYPE_NAME',
    'PLATFORM_TYPE_CODE',
    'TARGETING_TYPE_NAME',
    'TARGETING_TYPE_CODE',
    'TRAFFIC_SOURCE_NAME',
    'TRAFFIC_SOURCE_CODE',
    'CONTENT_PLATFORM_NAME',
    'CONTENT_PLATFORM_CODE',
    'AD_PLACEMENT_NAME',
    'AD_PLACEMENT_CODE',
    'REQUESTED_AD_TYPE_NAME',
    'REQUESTED_AD_TYPE_CODE',
    'SERVED_AD_TYPE_NAME',
    'SERVED_AD_TYPE_CODE',
    'AD_FORMAT_NAME',
    'AD_FORMAT_CODE',
    'CUSTOM_SEARCH_STYLE_NAME',
    'CUSTOM_SEARCH_STYLE_ID',
    'DOMAIN_REGISTRANT',
    'WEBSEARCH_QUERY_STRING',
    'OS_TYPE_NAME',
    'OS_TYPE_CODE',
    'BROWSER_TYPE_NAME',
    'BROWSER_TYPE_CODE',
    'WEBVIEW_TYPE_NAME',
    'WEBVIEW_TYPE_CODE',
] as const;

export type ReportDimension = typeof REPORT_DIMENSIONS[number];

/**
 * All report metrics supported by the AdSense Management API v2.
 * https://developers.google.com/adsense/management/reference/rest/v2/Metric
 */
export const REPORT_METRICS = [
    'PAGE_VIEWS',
    'AD_REQUESTS',
    'MATCHED_AD_REQUESTS',
    'TOTAL_IMPRESSIONS',
    'IMPRESSIONS',
    'INDIVIDUAL_AD_IMPRESSIONS',
    'CLICKS',
    'PAGE_VIEWS_SPAM_RATIO',
    'AD_REQUESTS_SPAM_RATIO',
    'MATCHED_AD_REQUESTS_SPAM_RATIO',
    'IMPRESSIONS_SPAM_RATIO',
    'INDIVIDUAL_AD_IMPRESSIONS_SPAM_RATIO',
    'CLICKS_SPAM_RATIO',
    'AD_REQUESTS_COVERAGE',
    'PAGE_VIEWS_CTR',
    'AD_REQUESTS_CTR',
    'MATCHED_AD_REQUESTS_CTR',
    'IMPRESSIONS_CTR',
    'INDIVIDUAL_AD_IMPRESSIONS_CTR',
    'ACTIVE_VIEW_MEASURABILITY',
    'ACTIVE_VIEW_VIEWABILITY',
    'ACTIVE_VIEW_TIME',
    'ESTIMATED_EARNINGS',
    'PAGE_VIEWS_RPM',
    'AD_REQUESTS_RPM',
    'MATCHED_AD_REQUESTS_RPM',
    'IMPRESSIONS_RPM',
    'INDIVIDUAL_AD_IMPRESSIONS_RPM',
    'COST_PER_CLICK',
    'ADS_PER_IMPRESSION',
    'TOTAL_EARNINGS',
    'WEBSEARCH_RESULT_PAGES',
    'FUNNEL_REQUESTS',
    'FUNNEL_IMPRESSIONS',
    'FUNNEL_CLICKS',
    'FUNNEL_RPM',
] as const;

export type ReportMetric = typeof REPORT_METRICS[number];

export interface ReportQuery {
    accountId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    dimensions?: ReportDimension[];
    metrics?: ReportMetric[];
    orderBy?: string | string[];
    limit?: number;
    filters?: string[];
    currencyCode?: string;
    dateRange?: 'CUSTOM' | 'TODAY' | 'YESTERDAY' | 'MONTH_TO_DATE' | 'YEAR_TO_DATE' | 'LAST_7_DAYS' | 'LAST_30_DAYS';
}

export interface ReportRow {
    cells: Array<{
        value: string;
    }>;
}

export interface ReportResponse {
    headers: Array<{
        name: string;
        type: 'DIMENSION' | 'METRIC_TALLY' | 'METRIC_RATIO' | 'METRIC_CURRENCY' | 'METRIC_MILLISECONDS' | 'METRIC_DECIMAL';
        currencyCode?: string;
    }>;
    rows: ReportRow[];
    totals?: ReportRow;
    averages?: ReportRow;
    startDate?: { year: number; month: number; day: number };
    endDate?: { year: number; month: number; day: number };
    totalMatchedRows?: string;
}

// Earnings Summary (computed)
export interface EarningsSummary {
    today: EarningsPeriod;
    yesterday: EarningsPeriod;
    last7Days: EarningsPeriod;
    thisMonth: EarningsPeriod;
    lastMonth: EarningsPeriod;
}

export interface EarningsPeriod {
    earnings: number;
    impressions: number;
    clicks: number;
    ctr: number;
    rpm: number;
    pageViews: number;
}

// Cache types
export interface CacheEntry {
    id?: number;
    cacheKey: string;
    accountId: string;
    queryHash: string;
    responseData: string;
    createdAt: number;
    expiresAt: number;
}

// Tool input types
export interface ListAccountsInput {
    // No parameters
}

export interface EarningsSummaryInput {
    accountId?: string;
}

export interface GenerateReportInput {
    accountId?: string;
    startDate?: string;
    endDate?: string;
    dimensions?: string[];
    metrics?: string[];
    orderBy?: string;
    limit?: number;
}

export interface ComparePeriodsInput {
    accountId?: string;
    period1Start: string;
    period1End: string;
    period2Start: string;
    period2End: string;
    dimensions?: string[];
}

export interface ListSitesInput {
    accountId?: string;
}

export interface ListAlertsInput {
    accountId?: string;
}

export interface ListPolicyIssuesInput {
    accountId?: string;
}

export interface ListPaymentsInput {
    accountId?: string;
}

export interface ListAdUnitsInput {
    accountId?: string;
}

export interface GetAdCodeInput {
    accountId?: string;
    adClientId: string;
    adUnitId: string;
}

export interface ExportCsvInput {
    accountId?: string;
    startDate: string;
    endDate: string;
    dimensions?: string[];
    metrics?: string[];
}
