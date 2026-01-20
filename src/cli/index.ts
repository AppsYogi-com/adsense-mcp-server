#!/usr/bin/env node
/**
 * AdSense MCP CLI
 */

import { Command } from 'commander';
import { runInit } from './init.js';
import { runDoctor } from './doctor.js';
import { runServer } from './run.js';

const program = new Command();

program
    .name('adsense-mcp')
    .description('AdSense MCP Server - Query earnings, reports, alerts via Claude')
    .version('0.1.0');

program
    .command('init')
    .description('Initialize OAuth authentication with Google AdSense')
    .option('--client-id <id>', 'OAuth Client ID')
    .option('--client-secret <secret>', 'OAuth Client Secret')
    .option('--service-account <path>', 'Path to service account JSON key file')
    .action(async (options) => {
        await runInit(options);
    });

program
    .command('doctor')
    .description('Check authentication and API access')
    .action(async () => {
        await runDoctor();
    });

program
    .command('run')
    .description('Start the MCP server')
    .option('--account <id>', 'Default AdSense account ID to use')
    .action(async (options) => {
        await runServer(options);
    });

// Default command: run server
program
    .argument('[command]', 'Command to run')
    .action(async (cmd) => {
        if (!cmd) {
            await runServer({});
        }
    });

program.parse();
