# AdSense-MCP Copilot Instructions

## Project Overview
This is a **Model Context Protocol (MCP) server** that provides Google AdSense API access to AI clients (Claude, Cursor, VS Code Copilot). It's distributed as a CLI tool via npm (`adsense-mcp`) with OAuth/service account authentication.

## Architecture

```
src/
├── index.ts          # Public exports for programmatic use
├── types.ts          # TypeScript types (single source of truth)
├── cli/              # Commander-based CLI (`adsense-mcp init|doctor|run`)
├── server/           # MCP server implementation
│   ├── index.ts      # Server factory with stdio transport
│   ├── tools/        # MCP tools organized by domain
│   └── resources/    # MCP resources
├── adsense/
│   ├── client.ts     # AdSense API wrapper with all operations
│   ├── rateLimiter.ts # Rate limiting with exponential backoff
│   └── cache.ts      # SQLite cache with TTL
└── auth/             # OAuth2 + service account auth, token storage
```

**Key data flows:**
1. CLI commands → `createServer()` → MCP stdio transport
2. Tool calls → `handleToolCall()` routes to domain handlers → `AdSenseClient` → Google API
3. Tokens stored via `keytar` (OS keychain) with file fallback; config in `env-paths` directories

## Development Commands

```bash
npm run build      # tsup build (ESM, Node 18+)
npm run dev        # Watch mode
npm run typecheck  # tsc --noEmit
npm run lint       # eslint src/
adsense-mcp doctor # Check auth and API access
```

## Code Conventions

### Adding New MCP Tools
1. Create tool definition in `src/server/tools/<domain>.ts` following the pattern:
   - Export handler function like `handle<Action>(args)`
2. Register in `src/server/tools/index.ts`:
   - Add tool schema to `registerTools()` array
   - Add case to `handleToolCall()` switch
3. Tool names use underscore notation: `adsense_earnings_summary`, `adsense_list_sites`

### Type Definitions
- Define types in `src/types.ts`
- Tool input schemas use plain JSON Schema format for MCP

### Error Handling Pattern
```typescript
try {
    const result = await client.someOperation();
    return { data: result };
} catch (error: any) {
    return { error: error.message };
}
```

### Rate Limiting
- AdSense API: 100 requests/minute/user
- Use `rateLimiter.throttle()` before API calls
- Use `withRetry()` wrapper for automatic exponential backoff

### Caching Strategy
- Today's data: 5 minutes TTL (frequently changing)
- Yesterday's data: 1 hour TTL
- Historical data (>2 days): 24 hours TTL
- Account/site info: 1 hour TTL

## Security Notes
- **Read-only scope only** (`adsense.readonly`) - no write operations
- Never log or expose tokens
- Credentials stored in OS keychain, never in repo
