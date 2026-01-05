import { ProgressManager } from './progress-manager.js';
import { formatProgressText, formatPercentageString, createToolResult } from './utils.js';

export function createTools(notifier, progressManager = new ProgressManager()) {
  const tools = {
    notify: {
      config: {
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
      handler: async ({ title, message, sound = false }) => {
        notifier.notify({
          title,
          message,
          sound: sound ? 'default' : false,
          wait: false,
        });

        return createToolResult(`Notification sent: "${title}"`);
      },
    },

    start_progress: {
      config: {
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
      handler: async ({ progressToken, title, total }) => {
        try {
          progressManager.start(progressToken, title, total);
          
          const progressText = formatProgressText(0, total);
          notifier.notify({
            title,
            message: progressText,
            sound: false,
            wait: false,
          });

          return createToolResult(`Progress started: "${title}" (token: ${progressToken})`);
        } catch (error) {
          return createToolResult(error.message, true);
        }
      },
    },

    update_progress: {
      config: {
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
      handler: async ({ progressToken, current, total, message }) => {
        try {
          const progress = progressManager.update(progressToken, current, total, message);
          
          const progressText = formatProgressText(current, progress.total);
          const percentageStr = formatPercentageString(current, progress.total);
          const notificationMessage = message ? `${progressText} - ${message}` : progressText;

          notifier.notify({
            title: progress.title,
            message: notificationMessage,
            sound: false,
            wait: false,
          });

          const responseText = `Progress updated: ${current}${progress.total ? `/${progress.total}` : ''}${percentageStr}${message ? ` - ${message}` : ''}`;
          return createToolResult(responseText);
        } catch (error) {
          return createToolResult(error.message, true);
        }
      },
    },

    complete_progress: {
      config: {
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
      handler: async ({ progressToken, message }) => {
        try {
          const { progress, duration } = progressManager.complete(progressToken);
          
          const completionMessage = message || `Completed in ${duration}s`;
          notifier.notify({
            title: `✓ ${progress.title}`,
            message: completionMessage,
            sound: 'default',
            wait: false,
          });

          return createToolResult(`Progress completed: "${progress.title}" (${duration}s)${message ? ` - ${message}` : ''}`);
        } catch (error) {
          return createToolResult(error.message, true);
        }
      },
    },
  };

  return { tools, progressManager };
}
