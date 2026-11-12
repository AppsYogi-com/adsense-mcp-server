# AdSense-MCP-Server

> Google AdSense MCP Server — Connect Google AdSense to Claude, Cursor, and other MCP clients.

[![npm version](https://img.shields.io/npm/v/@appsyogi/adsense-mcp-server.svg)](https://www.npmjs.com/package/@appsyogi/adsense-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@appsyogi/adsense-mcp-server.svg)](https://www.npmjs.com/package/@appsyogi/adsense-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/AppsYogi-com/adsense-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/AppsYogi-com/adsense-mcp-server/actions/workflows/ci.yml)

## Features

- 📊 **Earnings Summary** — Quick overview of today, yesterday, last 7 days, and monthly earnings
- 📈 **Detailed Reports** — Every AdSense v2 dimension and metric, with sorting and filters
- 🔄 **Period Comparison** — Compare performance between time periods
- 🌐 **Site Status** — Check approval status for all your sites
- ⚠️ **Alerts & Policy Issues** — Monitor account health and catch violations early
- 💰 **Payment History** — View payment history and pending earnings
- 📦 **Ad Units** — List ad units and get embed codes
- 📤 **CSV Export** — Export reports for further analysis
- 💾 **Caching** — SQLite cache for faster repeated queries
- 🔐 **Secure** — Read-only scope, tokens in your OS keychain, signed npm releases with provenance

## Quick Start

```bash
npm install -g @appsyogi/adsense-mcp-server
adsense-mcp init      # sign in with Google (opens your browser)
adsense-mcp doctor    # check everything works
```

Then [add the server to your MCP client](#5-add-to-your-mcp-client). The first time, you also need a [Google Cloud OAuth client](#1-create-a-google-cloud-oauth-client-one-time).

## Requirements

- **Node.js 18 or newer.** Node.js 22+ is recommended, since 18 and 20 have reached end-of-life and [v0.3.0](https://github.com/AppsYogi-com/adsense-mcp-server/milestone/1) will require 22.
- A Google account with access to an AdSense account
- A Google Cloud project, used only to create your own OAuth client (free)

## Setup

### 1. Create a Google Cloud OAuth client (one-time)

This server signs in with **your own** OAuth client, so your data never passes through a third party.

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. **Enable the AdSense Management API**: go to **APIs & Services → Library**, search for "AdSense Management API", and click **Enable**.
3. **Configure the consent screen**: go to **APIs & Services → OAuth consent screen** (shown as **Google Auth Platform** in newer consoles).
   - Choose an app name and set **Audience** to **External**.
   - Under **Test users**, add the Google account that owns your AdSense account.
4. **Create the OAuth client**: go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - **Application type: Desktop app.** This is required, because only Desktop app clients accept the local `127.0.0.1` redirect that `init` uses.
   - Copy the **Client ID** (ends in `.apps.googleusercontent.com`) and the **Client Secret** (usually starts with `GOCSPX-`).

> While the app's publishing status is **Testing**, only test users can sign in, and Google expires sign-ins after **7 days**. See [invalid_grant](#invalid_grant-after-a-week) if you'd rather not sign in again every week.

### 2. Install

```bash
npm install -g @appsyogi/adsense-mcp-server
```

This installs the `adsense-mcp` command. You can also run it without installing, using `npx @appsyogi/adsense-mcp-server <command>`.

### 3. Sign in

```bash
adsense-mcp init
```

1. Paste your **Client ID** and **Client Secret** when asked. If you swap them by mistake, `init` notices and fixes the order.
2. Your browser opens Google's sign-in page. Choose the account that owns your AdSense account and approve **read-only** access.
3. The browser shows **"AdSense MCP is authorized"**, and the terminal prints **"✅ Authentication successful!"**

How it works: `init` starts a temporary local server on `http://127.0.0.1:<random port>` and Google redirects back to it, using PKCE and a `state` check. You never copy or paste a code. The link is valid for **5 minutes**, and each run creates a new link.

If the browser doesn't open, or you're on a different machine from the terminal, copy the printed `https://accounts.google.com/...` link into a browser yourself.

### 4. Verify

```bash
adsense-mcp doctor
```

```
✅ Config: OAuth client 123456789012…abcd (saved 11/12/2026, 1:18:35 PM)
✅ Tokens: Sign-in saved (with refresh token)
✅ AdSense API: Found 1 account(s)
✅ Cache: Not yet created (will be created on first use)

✅ All checks passed! Server is ready to use.
```

When everything passes, `doctor` also prints a ready-to-paste MCP config with the exact paths for your machine.

### 5. Add to your MCP client

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, or `%APPDATA%\Claude\claude_desktop_config.json` on Windows. Add an `adsense` entry under `mcpServers`, keeping any servers already there.

**Recommended: full paths.** Desktop apps don't load your shell's `PATH`, so `node` and `npx` from nvm, fnm or asdf often can't be found. This server also contains native modules built for one specific Node.js version.

```json
{
    "mcpServers": {
        "adsense": {
            "command": "/Users/you/.nvm/versions/node/v24.11.0/bin/node",
            "args": [
                "/Users/you/.nvm/versions/node/v24.11.0/lib/node_modules/@appsyogi/adsense-mcp-server/dist/cli/index.js",
                "run"
            ]
        }
    }
}
```

`which node` and `npm root -g` show the right paths, or copy the config `adsense-mcp doctor` prints.

**Alternative: npx.** This works if `npx` is on the `PATH` that Claude Desktop sees:

```json
{
    "mcpServers": {
        "adsense": {
            "command": "npx",
            "args": ["-y", "@appsyogi/adsense-mcp-server", "run"]
        }
    }
}
```

Quit Claude Desktop completely (⌘Q) and reopen it, then ask *"List my AdSense accounts"*.

#### Claude Code

```bash
claude mcp add adsense -- adsense-mcp run
```

#### VS Code (`.vscode/mcp.json`)

```json
{
    "servers": {
        "adsense": {
            "type": "stdio",
            "command": "npx",
            "args": ["-y", "@appsyogi/adsense-mcp-server", "run"]
        }
    }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `adsense_list_accounts` | List all AdSense accounts you have access to |
| `adsense_earnings_summary` | Quick earnings overview (today, yesterday, last 7 days, this month, last month) |
| `adsense_generate_report` | Detailed reports with custom dimensions, metrics, sorting and filters |
| `adsense_compare_periods` | Compare performance between two time periods |
| `adsense_list_sites` | List all sites with their approval status |
| `adsense_list_alerts` | Get account alerts and warnings |
| `adsense_list_policy_issues` | Check for policy violations |
| `adsense_list_payments` | View payment history and pending earnings |
| `adsense_list_ad_units` | List all ad units |
| `adsense_get_ad_code` | Get HTML embed code for an ad unit |
| `adsense_export_csv` | Export report data as CSV |

### Report options

`adsense_generate_report` and `adsense_export_csv` accept:

- **`dimensions` / `metrics`**: any [AdSense v2 dimension](https://developers.google.com/adsense/management/reference/rest/v2/Dimension) (56) or [metric](https://developers.google.com/adsense/management/reference/rest/v2/Metric) (36), such as `COUNTRY_NAME`, `PLATFORM_TYPE_CODE`, `CUSTOM_CHANNEL_NAME`, `ESTIMATED_EARNINGS` or `PAGE_VIEWS_RPM`. Names are case-insensitive and can be comma-separated.
- **`orderBy`** (`adsense_generate_report` only): a dimension or metric, prefixed with `-` for descending or `+` for ascending, e.g. `-ESTIMATED_EARNINGS`.
- **`filters`**: `DIMENSION==value` for an exact match or `DIMENSION=@value` for "contains", e.g. `COUNTRY_CODE==US`.
  - Separate entries are combined with AND.
  - Use a comma inside one entry for OR, e.g. `COUNTRY_CODE==US,COUNTRY_CODE==GB`.
  - Date dimensions can't be filtered; use the date range instead.

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
You: Show me last week's top 5 countries by earnings, mobile only

Claude: [Runs adsense_generate_report with dimensions COUNTRY_NAME,
         orderBy -ESTIMATED_EARNINGS, filters PLATFORM_TYPE_CODE==HighEndMobile, limit 5]
```

## CLI Commands

### `adsense-mcp init`
Sign in with your Google Cloud OAuth client and save your tokens.

```bash
# Interactive: prompts for Client ID and Secret, then opens the browser
adsense-mcp init

# Non-interactive credentials
adsense-mcp init --client-id <id>.apps.googleusercontent.com --client-secret <secret>

# Use a fixed port for the OAuth redirect (default: random free port)
adsense-mcp init --port 8085

# Use a service account (AdSense for Platforms only, see note below)
adsense-mcp init --service-account /path/to/key.json
```

> **Service accounts:** The AdSense Management API [doesn't support service accounts](https://developers.google.com/adsense/management/direct_requests) for regular AdSense accounts. They only work for [AdSense for Platforms](https://developers.google.com/adsense/platforms/api/authenticating-api-calls) accounts, after Google adds the service account to your AdSense account through your account manager. Everyone else should use OAuth (plain `init`). Running `init --service-account` replaces any existing OAuth setup.

### `adsense-mcp doctor`
Checks your saved config and tokens, calls the AdSense API, and explains how to fix anything that fails. It also warns if a recent `init` didn't finish signing in.

```bash
adsense-mcp doctor
```

### `adsense-mcp run`
Starts the MCP server over stdio. Your MCP client normally runs this for you.

```bash
# Use the default account (the first one your Google account can access)
adsense-mcp run

# Use a specific account
adsense-mcp run --account pub-9876543210987654
```

## Multiple Accounts

By default the server uses the first AdSense account your Google account can access. To use another one:

1. **Per request:** pass `accountId` to any tool, or just ask Claude for a specific account. Use `adsense_list_accounts` to see the IDs.
2. **As the default:** add `"--account", "pub-…"` to the `args` in your MCP config, or set the `ADSENSE_ACCOUNT_ID` environment variable.

## Updating

```bash
npm install -g @appsyogi/adsense-mcp-server@latest
adsense-mcp doctor
```

If you're upgrading from **0.1.x**, run `adsense-mcp init` once more. Google blocked the sign-in method that 0.1.x used.

## Data Storage

Everything stays on your machine:

| What | Where |
|------|-------|
| Config (`config.json`) and report cache (`cache.sqlite`) | macOS: `~/Library/Preferences/adsense-mcp-nodejs/`<br>Linux: `~/.config/adsense-mcp-nodejs/`<br>Windows: `%APPDATA%\adsense-mcp-nodejs\Config\` |
| OAuth tokens | Your OS keychain (via keytar). If no keychain is available, `tokens.json` in the config folder, readable only by you. |
| OAuth client from your last `init`, and any service-account key | `~/.config/adsense-mcp/` |

## Security

- **Read-only access:** only the `adsense.readonly` scope is requested, so nothing in your account can be changed.
- **Your own OAuth client:** sign-in happens directly between your machine and Google.
- **Secure token storage:** tokens are kept in your OS keychain whenever one is available.
- **Signed releases:** packages are published from GitHub Actions through npm trusted publishing, with [provenance](https://docs.npmjs.com/generating-provenance-statements). Check them with `npm audit signatures`.
- **No telemetry:** we don't collect any usage data.

## Rate Limits

The AdSense API has strict rate limits (100 requests/minute). This server:
- Caches responses intelligently (5min-24hr based on data type)
- Implements exponential backoff for retries
- Tracks request rates to avoid hitting limits

## Troubleshooting

Start with `adsense-mcp doctor`. Most failures come with a suggested fix.

### "The out-of-band (OOB) flow has been blocked"
You're on 0.1.x, which used a sign-in method Google has shut down. [Update](#updating), then run `adsense-mcp init` again.

### "Error 401: invalid_client" / "The OAuth client was not found"
The Client ID is wrong, the client was deleted, or the ID and secret were swapped. Copy both again from **APIs & Services → Credentials** and re-run `init`.

### "Error 400: redirect_uri_mismatch"
Your OAuth client isn't of type **Desktop app**. Create a Desktop app client. If you have to use a **Web application** client, add `http://127.0.0.1:8085` as an authorized redirect URI and run `adsense-mcp init --port 8085`.

### "Access blocked" / "Error 403: access_denied"
The Google account you signed in with isn't a **test user**. Add it under **OAuth consent screen → Test users**.

### Google shows "400. That's an error … malformed"
This usually comes from the browser's Google session, not this tool.
- Copy the link from the terminal into a private window, or a browser profile signed in only to your AdSense account.
- Use the link from the latest `init` run; older links stop working.

### "Timed out waiting for authorization"
Sign-in wasn't completed within 5 minutes. Run `adsense-mcp init` again.

### `invalid_grant` after a week
Your sign-in expired or was revoked. While the consent screen is in **Testing**, Google expires sign-ins after 7 days, so run `adsense-mcp init` again. To avoid this, set the app's publishing status to **In production**. Google then shows an "unverified app" warning during sign-in, which is fine for personal use.

### "was compiled against a different Node.js version" (`NODE_MODULE_VERSION`)
The native modules were built for a different Node.js version than the one running the server. Fix it in either of two ways:
- Reinstall with the Node.js version your MCP client uses: `npm install -g @appsyogi/adsense-mcp-server`.
- Use full paths in your MCP config, as shown in [Claude Desktop](#claude-desktop).

### The server doesn't show up in Claude Desktop
- Check the log: `~/Library/Logs/Claude/mcp-server-adsense.log` on macOS, or `%APPDATA%\Claude\logs\` on Windows.
- `spawn node ENOENT` or `spawn npx ENOENT` means Claude Desktop can't find Node.js. Use [full paths](#claude-desktop).
- After editing the config, quit Claude Desktop completely (⌘Q) before reopening it.

### "No AdSense accounts found" / "Account not found"
Sign in with the Google account that has access to AdSense. Run `adsense-mcp doctor` to see which accounts are found.

### "Rate limit exceeded"
Wait a minute and try again. The server retries automatically with backoff.

## Development

```bash
git clone https://github.com/AppsYogi-com/adsense-mcp-server.git
cd adsense-mcp-server
npm install
npm run typecheck
npm run build
node dist/cli/index.js doctor
```

Use `npm run dev` to rebuild on every change.

## Contributing

Contributions are welcome! Open an issue or PR. Planned work is tracked in the [v0.3.0 milestone](https://github.com/AppsYogi-com/adsense-mcp-server/milestone/1).

## License

MIT

## Credits

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [googleapis](https://github.com/googleapis/google-api-nodejs-client)
- [commander](https://github.com/tj/commander.js)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [keytar](https://github.com/atom/node-keytar)
