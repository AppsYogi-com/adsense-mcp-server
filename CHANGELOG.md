# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-20

### Added
- Initial release
- **Earnings**: Real-time earnings summary (today, yesterday, 7 days, month)
- **Reports**: Custom reports with dimensions and metrics
- **Period Comparison**: Compare performance between two time periods
- **Sites**: List sites with approval status (READY, GETTING_READY, etc.)
- **Alerts**: Account alerts and warnings by severity
- **Policy Issues**: Policy violations affecting monetization
- **Payments**: Payment history and pending earnings
- **Ad Units**: List all ad units across ad clients
- **Ad Code**: Get HTML embed code for ad units
- **Export**: CSV export for reports
- **Caching**: SQLite cache with TTL-based invalidation
- **Rate Limiting**: Exponential backoff with 100 req/min limit
- **Authentication**: OAuth2 and service account support
- **Secure Storage**: Tokens stored in OS keychain via keytar

### Tools (11 total)
- `adsense_list_accounts` - List all AdSense accounts
- `adsense_earnings_summary` - Quick earnings overview
- `adsense_generate_report` - Custom performance reports
- `adsense_compare_periods` - Compare two time periods
- `adsense_list_sites` - Sites with approval status
- `adsense_list_alerts` - Account alerts (INFO/WARNING/SEVERE)
- `adsense_list_policy_issues` - Policy violations
- `adsense_list_payments` - Payment history
- `adsense_list_ad_units` - All ad units
- `adsense_get_ad_code` - Get ad unit embed code
- `adsense_export_csv` - Export report as CSV

### Security
- Read-only scope (`adsense.readonly`) by design for safety
- No write operations to prevent accidental changes
