#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import notifier from 'node-notifier';
import { createTools } from './src/tools.js';

const server = new McpServer(
  {
    name: 'mcp-progress',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

const { tools } = createTools(notifier);

// Register all tools
Object.entries(tools).forEach(([name, { config, handler }]) => {
  server.registerTool(name, config, handler);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Progress Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
