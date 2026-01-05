# MCP Progress Server

An MCP (Model Context Protocol) server that provides notifications and progress tracking for long-running operations.

## Features

- **Notifications**: Display system notifications using node-notifier
- **Progress Tracking**: Track progress of long-running operations with MCP-compatible progress notifications

## Installation

### For use with npx (recommended)

```bash
npx mcp-progress
```

### For global installation

```bash
npm install -g mcp-progress
```

### For local development

```bash
git clone git@github.com:jaume-ferrarons/mcp-progress.git
cd mcp-progress
npm install
```

## Usage

Run the server:

```bash
npm start
```

Or use it as an MCP server in your MCP client configuration.

## Tools

### notify

Display a notification to the user.

**Parameters:**
- `title` (string, required): Notification title
- `message` (string, required): Notification message
- `sound` (boolean, optional): Play notification sound (default: false)

**Note:** Notifications stay visible until dismissed by the user.

**Example:**
```json
{
  "title": "Task Complete",
  "message": "Your operation finished successfully",
  "sound": true
}
```

### start_progress

Start tracking progress for a long-running operation. Creates a sticky notification that updates as progress changes.

**Parameters:**
- `progressToken` (string, required): Unique identifier for this progress operation
- `title` (string, required): Title of the operation
- `total` (number, optional): Total number of steps

**Example:**
```json
{
  "progressToken": "file-processing-1",
  "title": "Processing files",
  "total": 100
}
```

### update_progress

Update progress for an ongoing operation. Updates the sticky notification with current progress.

**Parameters:**
- `progressToken` (string, required): Progress operation identifier
- `current` (number, required): Current progress value
- `total` (number, optional): Total progress value (updates total if provided)
- `message` (string, optional): Progress message

**Example:**
```json
{
  "progressToken": "file-processing-1",
  "current": 45,
  "message": "Processing file 45 of 100"
}
```

### complete_progress

Mark a progress operation as complete. Updates the notification with completion status and plays a sound.

**Parameters:**
- `progressToken` (string, required): Progress operation identifier
- `message` (string, optional): Completion message

**Example:**
```json
{
  "progressToken": "file-processing-1",
  "message": "All files processed successfully"
}
```

## Example Workflow

```javascript
// Start progress tracking
await callTool('start_progress', {
  progressToken: 'data-sync-1',
  title: 'Syncing data',
  total: 50
});

// Update progress periodically
for (let i = 1; i <= 50; i++) {
  await callTool('update_progress', {
    progressToken: 'data-sync-1',
    current: i,
    message: `Processing item ${i}`
  });
}

// Complete the operation
await callTool('complete_progress', {
  progressToken: 'data-sync-1',
  message: 'Sync completed'
});

// Send a notification
await callTool('notify', {
  title: 'Sync Complete',
  message: 'Data synchronization finished successfully',
  sound: true
});
```

## MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "progress": {
      "command": "npx",
      "args": ["-y", "mcp-progress"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "progress": {
      "command": "mcp-progress"
    }
  }
}
```

## License

ISC

## VS Code Setup

This project is configured to work with GitHub Copilot in VS Code. The MCP server configuration is in `.vscode/mcp.json`.

To use with Copilot:
1. Open this project in VS Code
2. Make sure GitHub Copilot Chat is enabled
3. The MCP server will be automatically available in Copilot Chat
4. Use the tools: `@workspace /tools` to see available tools

You can also configure it globally by adding to your VS Code settings:
```json
{
  "github.copilot.chat.mcp.enabled": true
}
```
