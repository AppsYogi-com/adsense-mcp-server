# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-12

### Fixed
- **OAuth setup works again.** Google has blocked the out-of-band (OOB) flow that `init` used, so sign-in failed. `init` now uses a loopback redirect (`http://127.0.0.1:<port>`) with PKCE and a `state` check. The browser opens automatically, and you no longer paste a code by hand.
- `init`: Detects a swapped Client ID and Client Secret, and rejects a Client ID that isn't valid.
- `init --service-account`: Now saves the config, so service-account auth is actually used; before, it only copied the key file. The setup message no longer tells you to use domain-wide delegation, and now explains that service accounts only work for AdSense for Platforms accounts.
- `doctor`: Now checks the config and tokens the server actually uses, instead of a file `init` writes before sign-in. It also flags an `init` that never finished, skips the API check when setup is incomplete, gives hints for `invalid_client`, `invalid_grant` and Node.js version mismatches, finds the real cache file, and suggests the correct npm package name in the MCP config.
- Reports: `orderBy` now uses the v2 `+`/`-` prefix syntax. The old `X DESC` form made sorted reports fail with "invalid argument" (#1).
- `--version` and the MCP server now report the real package version. It was hard-coded as 0.1.0.
- `google-auth-library`, which the code imports directly, is now a declared dependency.

### Added
- `init --port <number>` to pin the local OAuth redirect port.
- Reports: every AdSense v2 dimension (56) and metric (36) is now validated and listed in the MCP tool schemas, and `filters` is exposed on `adsense_generate_report` and `adsense_export_csv`. Field names are case-insensitive and can be comma-separated (#1, thanks @nicolasleroy).

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
