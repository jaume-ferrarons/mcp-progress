#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CreateMessageRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import notifier from 'node-notifier';

const server = new Server(
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

// Progress tracking state
const progressState = new Map();
// Active notification IDs for progress tracking
const progressNotifications = new Map();

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'notify',
        description: 'Display a notification to the user',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Notification title',
            },
            message: {
              type: 'string',
              description: 'Notification message',
            },
            sound: {
              type: 'boolean',
              description: 'Play notification sound (default: false)',
              default: false,
            },
          },
          required: ['title', 'message'],
        },
      },
      {
        name: 'start_progress',
        description: 'Start tracking progress for a long-running operation',
        inputSchema: {
          type: 'object',
          properties: {
            progressToken: {
              type: 'string',
              description: 'Unique identifier for this progress operation',
            },
            title: {
              type: 'string',
              description: 'Title of the operation',
            },
            total: {
              type: 'number',
              description: 'Total number of steps (optional)',
            },
          },
          required: ['progressToken', 'title'],
        },
      },
      {
        name: 'update_progress',
        description: 'Update progress for an ongoing operation',
        inputSchema: {
          type: 'object',
          properties: {
            progressToken: {
              type: 'string',
              description: 'Progress operation identifier',
            },
            current: {
              type: 'number',
              description: 'Current progress value',
            },
            total: {
              type: 'number',
              description: 'Total progress value (optional, updates total if provided)',
            },
            message: {
              type: 'string',
              description: 'Progress message (optional)',
            },
          },
          required: ['progressToken', 'current'],
        },
      },
      {
        name: 'complete_progress',
        description: 'Mark a progress operation as complete',
        inputSchema: {
          type: 'object',
          properties: {
            progressToken: {
              type: 'string',
              description: 'Progress operation identifier',
            },
            message: {
              type: 'string',
              description: 'Completion message (optional)',
            },
          },
          required: ['progressToken'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'notify': {
      const { title, message, sound = false } = args;

      notifier.notify({
        title,
        message,
        sound,
        wait: true,
        closeLabel: 'Close',
      });

      return {
        content: [
          {
            type: 'text',
            text: `Notification sent: "${title}"`,
          },
        ],
      };
    }

    case 'start_progress': {
      const { progressToken, title, total } = args;

      if (progressState.has(progressToken)) {
        return {
          content: [
            {
              type: 'text',
              text: `Progress token "${progressToken}" already exists`,
            },
          ],
          isError: true,
        };
      }

      const progress = {
        title,
        current: 0,
        total: total || null,
        startTime: Date.now(),
      };

      progressState.set(progressToken, progress);

      // Send initial progress notification
      await server.notification({
        method: 'notifications/progress',
        params: {
          progressToken,
          progress: 0,
          total: total || null,
        },
      });

      // Show sticky notification for progress
      const progressText = total ? `0/${total} (0%)` : '0';
      notifier.notify({
        title,
        message: progressText,
        sound: false,
        wait: true,
        closeLabel: 'Close',
      });

      return {
        content: [
          {
            type: 'text',
            text: `Progress started: "${title}" (token: ${progressToken})`,
          },
        ],
      };
    }

    case 'update_progress': {
      const { progressToken, current, total, message } = args;

      const progress = progressState.get(progressToken);
      if (!progress) {
        return {
          content: [
            {
              type: 'text',
              text: `Progress token "${progressToken}" not found`,
            },
          ],
          isError: true,
        };
      }

      progress.current = current;
      if (total !== undefined) {
        progress.total = total;
      }
      if (message !== undefined) {
        progress.message = message;
      }

      // Send progress notification
      await server.notification({
        method: 'notifications/progress',
        params: {
          progressToken,
          progress: current,
          total: progress.total,
        },
      });

      const percentage = progress.total
        ? Math.round((current / progress.total) * 100)
        : null;
      const percentageStr = percentage !== null ? ` (${percentage}%)` : '';

      // Update sticky notification
      const progressText = progress.total 
        ? `${current}/${progress.total} (${percentage}%)` 
        : `${current}`;
      const notificationMessage = message 
        ? `${progressText} - ${message}` 
        : progressText;

      notifier.notify({
        title: progress.title,
        message: notificationMessage,
        sound: false,
        wait: true,
        closeLabel: 'Close',
      });

      return {
        content: [
          {
            type: 'text',
            text: `Progress updated: ${current}${progress.total ? `/${progress.total}` : ''}${percentageStr}${message ? ` - ${message}` : ''}`,
          },
        ],
      };
    }

    case 'complete_progress': {
      const { progressToken, message } = args;

      const progress = progressState.get(progressToken);
      if (!progress) {
        return {
          content: [
            {
              type: 'text',
              text: `Progress token "${progressToken}" not found`,
            },
          ],
          isError: true,
        };
      }

      const duration = ((Date.now() - progress.startTime) / 1000).toFixed(2);

      // Send final progress notification
      await server.notification({
        method: 'notifications/progress',
        params: {
          progressToken,
          progress: progress.total || progress.current,
          total: progress.total,
        },
      });

      // Update sticky notification with completion
      const completionMessage = message || `Completed in ${duration}s`;
      notifier.notify({
        title: `✓ ${progress.title}`,
        message: completionMessage,
        sound: true,
        wait: true,
        closeLabel: 'Close',
      });

      progressState.delete(progressToken);

      return {
        content: [
          {
            type: 'text',
            text: `Progress completed: "${progress.title}" (${duration}s)${message ? ` - ${message}` : ''}`,
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Progress Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
