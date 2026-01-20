/**
 * Alerts and Policy Issues tools
 */

import { AdSenseClient } from '../../adsense/client.js';

/**
 * List alerts
 */
export async function handleListAlerts(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const client = await AdSenseClient.create(accountId);
    const alerts = await client.listAlerts(accountId);

    // Group by severity
    const bySeverity = {
        severe: alerts.filter(a => a.severity === 'SEVERE'),
        warning: alerts.filter(a => a.severity === 'WARNING'),
        info: alerts.filter(a => a.severity === 'INFO'),
    };

    // Format alerts with severity emoji
    const formatAlert = (alert: any) => {
        const severityEmojiMap: Record<string, string> = {
            'SEVERE': '🔴',
            'WARNING': '🟡',
            'INFO': '🔵',
            'SEVERITY_UNSPECIFIED': '⚪',
        };
        const severityEmoji = severityEmojiMap[alert.severity] || '⚪';

        return {
            message: alert.message,
            severity: alert.severity,
            severityEmoji,
            type: alert.type,
            name: alert.name,
        };
    };

    return {
        alerts: alerts.map(formatAlert),
        summary: {
            total: alerts.length,
            severe: bySeverity.severe.length,
            warning: bySeverity.warning.length,
            info: bySeverity.info.length,
        },
        hasIssues: bySeverity.severe.length > 0 || bySeverity.warning.length > 0,
        severityDescriptions: {
            SEVERE: 'Immediate action required (payment holds, violations)',
            WARNING: 'Action recommended',
            INFO: 'General notifications',
        },
    };
}

/**
 * List policy issues
 */
export async function handleListPolicyIssues(args: Record<string, unknown>) {
    const accountId = (args.accountId as string) || process.env.ADSENSE_ACCOUNT_ID;
    const client = await AdSenseClient.create(accountId);
    const issues = await client.listPolicyIssues(accountId);

    // Format policy issues with action emoji
    const formatIssue = (issue: any) => {
        const actionEmojiMap: Record<string, string> = {
            'WARNED': '⚠️',
            'AD_SERVING_RESTRICTED': '🔶',
            'AD_SERVING_DISABLED': '🔴',
            'AD_SERVED_WITH_CLICK_CONFIRMATION': '🟡',
            'AD_PERSONALIZATION_RESTRICTED': '🟠',
            'ENFORCEMENT_ACTION_UNSPECIFIED': '⚪',
        };
        const actionEmoji = actionEmojiMap[issue.action] || '⚪';

        return {
            site: issue.site,
            siteSection: issue.siteSection,
            uri: issue.uri,
            entityType: issue.entityType,
            action: issue.action,
            actionEmoji,
            adRequestCount: issue.adRequestCount,
            warningEscalationDate: issue.warningEscalationDate
                ? `${issue.warningEscalationDate.year}-${String(issue.warningEscalationDate.month).padStart(2, '0')}-${String(issue.warningEscalationDate.day).padStart(2, '0')}`
                : null,
            name: issue.name,
        };
    };

    // Group by action
    const byAction = {
        warned: issues.filter(i => i.action === 'WARNED'),
        restricted: issues.filter(i => i.action === 'AD_SERVING_RESTRICTED'),
        disabled: issues.filter(i => i.action === 'AD_SERVING_DISABLED'),
        clickConfirmation: issues.filter(i => i.action === 'AD_SERVED_WITH_CLICK_CONFIRMATION'),
        personalizationRestricted: issues.filter(i => i.action === 'AD_PERSONALIZATION_RESTRICTED'),
    };

    return {
        issues: issues.map(formatIssue),
        summary: {
            total: issues.length,
            warned: byAction.warned.length,
            restricted: byAction.restricted.length,
            disabled: byAction.disabled.length,
            clickConfirmation: byAction.clickConfirmation.length,
            personalizationRestricted: byAction.personalizationRestricted.length,
        },
        hasIssues: issues.length > 0,
        actionDescriptions: {
            WARNED: 'Pending enforcement with deadline - fix before escalation',
            AD_SERVING_RESTRICTED: 'Reduced ad demand on affected pages',
            AD_SERVING_DISABLED: 'Ads completely stopped on affected pages',
            AD_SERVED_WITH_CLICK_CONFIRMATION: 'Extra click verification required',
            AD_PERSONALIZATION_RESTRICTED: 'Limited to basic (non-personalized) ads',
        },
    };
}
