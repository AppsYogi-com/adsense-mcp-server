/**
 * MCP Server - Main setup
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { registerTools, handleToolCall } from './tools/index.js';
import { handleListResources, handleReadResource } from './resources/index.js';

/**
 * Create and configure the MCP server
 */
export function createServer() {
    const server = new Server(
        {
            name: 'adsense-mcp-server',
            version: '0.1.0',
        },
        {
            capabilities: {
                tools: {},
                resources: {},
            },
        }
    );

    // Register tool handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: registerTools(),
        };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        return handleToolCall(request.params.name, request.params.arguments || {});
    });

    // Register resource handlers
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return handleListResources();
    });

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        return handleReadResource(request.params.uri);
    });

    return server;
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer(accountId?: string) {
    // Store account ID in environment for tools to access
    if (accountId) {
        process.env.ADSENSE_ACCOUNT_ID = accountId;
    }

    const server = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await server.close();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await server.close();
        process.exit(0);
    });
}
