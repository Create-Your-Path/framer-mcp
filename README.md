# Framer MCP Server

MCP server for the [Framer Server API](https://www.framer.com/developers/server-api-introduction) — full CMS, canvas, publishing, styles, code files, and more. 37 tools across 10 domains.

## Security

This MCP server runs locally over stdio and uses your own Framer API key from environment variables. It does not ship with an API key and does not store credentials.

Keep these rules in mind:

- Never commit `.env`, `.env.local`, `.mcp.json`, or any file containing `FRAMER_API_KEY`.
- Use a dedicated Framer API key for automation and rotate it if it is ever exposed.
- Only connect this MCP to Framer projects you own or are authorized to manage.
- Treat write tools as production-capable: this server can create, update, remove, publish, and deploy Framer project content.
- Do not give untrusted agents access to a production project key.

## Setup

### Requirements

- Node.js 22 or newer
- A Framer project URL
- A Framer API key for that project

### 1. Get your Framer API key

Go to your Framer project → Site Settings → General → Generate API Key.

### 2. Install the server

Clone this repository and build the TypeScript source:

```bash
git clone https://github.com/Create-Your-Path/framer-mcp.git
cd framer-mcp
npm install
npm run build
```

### 3. Add to your MCP client

For Claude Code, add this to your project `.mcp.json`:

Replace `/absolute/path/to/framer-mcp` with the folder where you cloned this repository.

```json
{
  "mcpServers": {
    "framer": {
      "command": "node",
      "args": ["/absolute/path/to/framer-mcp/dist/bin/framer-mcp.js"],
      "env": {
        "FRAMER_PROJECT_URL": "https://framer.com/projects/YourSite--abc123",
        "FRAMER_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Restart your MCP client after saving the config.

### 4. Or run directly

```bash
FRAMER_PROJECT_URL="..." FRAMER_API_KEY="..." node dist/bin/framer-mcp.js
```

## Agent install prompt

Copy this into your coding agent if you want it to install the MCP for you:

```text
Install the Framer MCP server from https://github.com/Create-Your-Path/framer-mcp and connect it to my MCP client.

Steps:
1. Check that Node.js 22 or newer is installed.
2. Clone the repository into a sensible local developer tools folder.
3. Run npm install.
4. Run npm run build.
5. Ask me for my Framer project URL and Framer API key if I have not already provided them.
6. Add an MCP server named "framer" to my MCP config using:
   command: node
   args: ["/absolute/path/to/framer-mcp/dist/bin/framer-mcp.js"]
   env:
     FRAMER_PROJECT_URL: my Framer project URL
     FRAMER_API_KEY: my Framer API key
7. Do not commit, print, log, or expose my Framer API key.
8. Restart or tell me to restart the MCP client.
9. Verify the server by calling the framer_status tool.
```

## Tools (37)

### Project & Connection
- `framer_status` — Connection status and project info
- `framer_get_project_info` — Project metadata and publish URLs
- `framer_get_current_user` — Authenticated user info

### CMS / Collections
- `framer_get_collections` — List all collections
- `framer_get_collection_fields` — Get field schema
- `framer_get_collection_items` — Get items with field data
- `framer_create_collection` — Create a new collection
- `framer_upsert_collection_items` — Add or update items
- `framer_remove_collection_items` — Remove items by ID

### Publishing & Deploy
- `framer_get_changed_paths` — Diff since last publish
- `framer_get_publish_info` — Staging/production URLs and status
- `framer_publish` — Publish to staging preview
- `framer_deploy` — Promote to production

### Canvas Nodes
- `framer_get_node` — Get node by ID with properties
- `framer_get_children` — Get child nodes
- `framer_get_nodes_by_type` — Find nodes by type
- `framer_create_frame` — Create frame node
- `framer_create_text` — Create text node
- `framer_set_attributes` — Update node properties
- `framer_remove_nodes` — Remove nodes

### Pages
- `framer_get_pages` — List web and design pages
- `framer_create_web_page` — Create web page at path
- `framer_create_design_page` — Create design page

### Styles
- `framer_get_styles` — Get color and text styles
- `framer_create_color_style` — Create color style
- `framer_create_text_style` — Create text style

### Code Files
- `framer_get_code_files` — List code files and exports
- `framer_get_code_file` — Get file content
- `framer_create_code_file` — Create code file
- `framer_update_code_file` — Update file content

### Assets
- `framer_upload_image` — Upload image by URL
- `framer_upload_file` — Upload file by URL

### Localization
- `framer_get_locales` — Get locales and groups
- `framer_set_localization_data` — Update translations

### Site Settings
- `framer_get_redirects` — List URL redirects
- `framer_manage_redirects` — Add/remove redirects
- `framer_manage_custom_code` — Get/set custom code snippets

## Architecture

- **Transport**: stdio (long-lived process maintains WebSocket connection)
- **Connection**: Lazy auto-connect on first tool call
- **SDK**: `framer-api` (WebSocket) + `@modelcontextprotocol/sdk`
- **Language**: TypeScript with Zod validation

## Development

```bash
npm install
npm run build
npm run dev  # watch mode
```

Before publishing a package or release:

```bash
npm audit --omit=dev
npm run build
npm pack --dry-run
```

## License

MIT
