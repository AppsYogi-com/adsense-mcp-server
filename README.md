# AdSense-MCP-Server

> Google AdSense MCP Server — Connect Google AdSense to Claude, Cursor, and other MCP clients.

[![npm version](https://img.shields.io/npm/v/@appsyogi/adsense-mcp-server.svg)](https://www.npmjs.com/package/@appsyogi/adsense-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@appsyogi/adsense-mcp-server.svg)](https://www.npmjs.com/package/@appsyogi/adsense-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/AppsYogi-com/adsense-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/AppsYogi-com/adsense-mcp-server/actions/workflows/ci.yml)

## Features

- 📊 **Earnings Summary** — Quick overview of today, yesterday, last 7 days, and monthly earnings
- 📈 **Detailed Reports** — Generate reports with dimensions (date, site, country, ad unit) and metrics
- 🔄 **Period Comparison** — Compare performance between time periods
- 🌐 **Site Status** — Check approval status for all your sites
- ⚠️ **Alerts & Policy Issues** — Monitor account health and catch violations early
- 💰 **Payment History** — View payment history and pending earnings
- 📦 **Ad Units** — List ad units and get embed codes
- 📤 **CSV Export** — Export reports for further analysis
- 💾 **Caching** — SQLite cache for faster repeated queries
- 🔐 **Secure** — OAuth tokens stored in OS keychain, read-only scope

## Quick Start

```bash
# Install globally
npm install -g @appsyogi/adsense-mcp-server

# Set up OAuth credentials
adsense-mcp init

# Verify setup
adsense-mcp doctor

# Start the server (for MCP clients)
adsense-mcp run
```

## Prerequisites

### 1. Create Google Cloud OAuth Credentials

You need to create your own OAuth credentials in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **AdSense Management API**:
   - Go to "APIs & Services" → "Library"
   - Search for "AdSense Management API"
   - Click "Enable"
4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Desktop application"
   - Name it (e.g., "AdSense-MCP")
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**
6. Add test users (required while app is in testing mode):
   - Go to "APIs & Services" → "OAuth consent screen"
   - Scroll to "Test users" section
   - Click "Add users"
   - Add the Google account email(s) you'll use to authenticate
   - Click "Save"

> **Note:** While your app's publishing status is "Testing", only test users can authenticate. You can add up to 100 test users.

### 2. Configure AdSense-MCP

Run the init command and enter your credentials:

```bash
adsense-mcp init
```

This will:
- Prompt for your Client ID and Client Secret
- Open a browser for Google authentication
- Store your refresh token securely in the OS keychain

## Installation

```bash
npx @appsyogi/adsense-mcp-server init
```

## Quick Start

### 1. Initialize (OAuth Setup)

```bash
npx adsense-mcp init
```

This will:
- Open your browser for Google sign-in
- Request read-only access to your AdSense data
- Let you select your default account (if you have multiple)
- Store credentials securely

### 2. Verify Setup

```bash
npx adsense-mcp doctor
```

### 3. Add to Your MCP Client

#### VS Code Copilot (`~/.vscode/mcp.json`)

```json
{
    "servers": {
        "adsense": {
            "command": "npx",
            "args": ["@appsyogi/adsense-mcp-server", "run"],
            "type": "stdio"
        }
    }
}
```

#### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
    "mcpServers": {
        "adsense": {
            "command": "npx",
            "args": ["@appsyogi/adsense-mcp-server", "run"]
        }
    }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `adsense_list_accounts` | List all AdSense accounts you have access to |
| `adsense_earnings_summary` | Quick earnings overview (today, yesterday, last 7 days, this month) |
| `adsense_generate_report` | Generate detailed reports with custom dimensions and metrics |
| `adsense_compare_periods` | Compare performance between two time periods |
| `adsense_list_sites` | List all sites with their approval status |
| `adsense_list_alerts` | Get account alerts and warnings |
| `adsense_list_policy_issues` | Check for policy violations |
| `adsense_list_payments` | View payment history and pending earnings |
| `adsense_list_ad_units` | List all ad units |
| `adsense_get_ad_code` | Get HTML embed code for an ad unit |
| `adsense_export_csv` | Export report data as CSV |

## Example Conversations

### Check Earnings
```
You: How's my AdSense doing today?

Claude: 📊 **AdSense Earnings Summary**

| Period | Earnings | Impressions | Clicks | CTR |
|--------|----------|-------------|--------|-----|
| Today | $8.45 | 3,200 | 28 | 0.88% |
| Yesterday | $15.67 | 6,200 | 52 | 0.84% |
| Last 7 Days | $98.45 | 42,000 | 380 | 0.90% |
| This Month | $345.67 | 150,000 | 1,350 | 0.90% |

You're tracking 16% ahead of last month at this point! 🎉
```

### Check Site Status
```
You: Is my new site approved yet?

Claude: 📋 **Site Status**

| Site | Status | Notes |
|------|--------|-------|
| example.com | ✅ READY | Ads serving |
| blog.example.com | ⏳ GETTING_READY | Under review |
| newsite.com | ⚠️ NEEDS_ATTENTION | Insufficient content |
```

### Generate Report
```
You: Show me earnings by country for last week

Claude: [Generates report with COUNTRY_NAME dimension]
```

## CLI Commands

### `adsense-mcp init`
Set up OAuth authentication and select default account.

```bash
# Interactive setup
npx adsense-mcp init

# Set specific default account
npx adsense-mcp init --account pub-1234567890123456

# Use service account (AdSense for Platforms only, see note below)
npx adsense-mcp init --service-account /path/to/key.json

# Use a fixed port for the OAuth redirect (default: random free port)
npx adsense-mcp init --port 8085
```

> **Service accounts:** The AdSense Management API [doesn't support service accounts](https://developers.google.com/adsense/management/direct_requests) for regular AdSense accounts. They only work for [AdSense for Platforms](https://developers.google.com/adsense/platforms/api/authenticating-api-calls) accounts, after Google adds the service account to your AdSense account through your account manager. Everyone else should use OAuth (plain `init`). Running `init --service-account` replaces any existing OAuth setup.

`init` starts a temporary local server on `http://127.0.0.1:<port>` and opens your browser. After you approve access, Google redirects back to that local server and the CLI saves your tokens. You don't need to copy or paste a code.

### `adsense-mcp doctor`
Verify your setup and check account health.

```bash
npx adsense-mcp doctor
```

### `adsense-mcp run`
Start the MCP server (typically called by your MCP client).

```bash
# Use default account
npx adsense-mcp run

# Use specific account
npx adsense-mcp run --account pub-9876543210987654

# Verbose logging
npx adsense-mcp run --verbose
```

## Multi-Account Support

If you have multiple AdSense accounts, you can:

1. Select default during `init`
2. Override with `--account` flag
3. Use `adsense_list_accounts` tool to see all accounts
4. Pass `accountId` parameter to any tool

## Data Storage

All data is stored locally in `~/.config/adsense-mcp/`:

- `config.json` - Default account and settings
- `tokens.json` - OAuth refresh token (encrypted)
- `cache.sqlite` - Report cache for faster responses

## Security

- **Read-only access** - This server only requests `adsense.readonly` scope
- **Secure token storage** - Tokens are encrypted using OS keychain (via keytar)
- **Local only** - All data stays on your machine
- **No telemetry** - We don't collect any usage data

## Rate Limits

The AdSense API has strict rate limits (100 requests/minute). This server:
- Caches responses intelligently (5min-24hr based on data type)
- Implements exponential backoff for retries
- Tracks request rates to avoid hitting limits

## Troubleshooting

### "No tokens found" error
Run `npx adsense-mcp init` to set up authentication.

### "The out-of-band (OOB) flow has been blocked" error
Google has shut down the copy/paste (`urn:ietf:wg:oauth:2.0:oob`) OAuth flow. Upgrade to the latest version, which uses a local loopback redirect instead, then run `npx adsense-mcp init` again.

### "redirect_uri_mismatch" error
Your OAuth client must be of type **Desktop app**, which accepts any `http://127.0.0.1:<port>` redirect. If you have to use a **Web application** client, add `http://127.0.0.1:8085` as an authorized redirect URI and run `npx adsense-mcp init --port 8085`.

### "Rate limit exceeded" error
Wait a minute and try again. The server will automatically retry with backoff.

### "Account not found" error
Make sure you've selected a valid account during setup. Run `npx adsense-mcp doctor` to see available accounts.

## Development

```bash
# Clone the repo
git clone https://github.com/AppsYogi-com/adsense-mcp-server.git
cd adsense-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run in dev mode
npm run dev

# Test locally
node dist/cli/index.js doctor
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR.

## Credits

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [googleapis](https://github.com/googleapis/google-api-nodejs-client)
- [commander](https://github.com/tj/commander.js)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [keytar](https://github.com/atom/node-keytar)
