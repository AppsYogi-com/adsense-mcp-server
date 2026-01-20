/**
 * CLI: run command
 */

import { startServer } from '../server/index.js';

interface RunOptions {
    account?: string;
}

export async function runServer(options: RunOptions): Promise<void> {
    // Don't log to stdout as it interferes with MCP protocol
    // Log to stderr instead
    if (options.account) {
        process.stderr.write(`Using account: ${options.account}\n`);
    }

    await startServer(options.account);
}
