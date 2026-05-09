# Framer MCP Server

MCP server for the [Framer Server API](https://www.framer.com/developers/server-api-introduction) — lets your AI agent manage Framer CMS, pages, canvas nodes, publishing, styles, code files, and more.

An MCP server is a small tool that gives AI agents access to external apps through structured tools. This one runs locally on your machine and connects your AI agent to your own Framer project through Framer's official Server API. It does not send your Framer data or API key to me or to Create Your Path.

I built this because I wanted my agent to work on my Framer site without needing Framer open. This lets the agent manage content and a lot of the operational site work, while I can focus more on designing cool websites.

The idea came after Framer released the [Server API](https://www.framer.com/updates/server-api) in February 2026. I used Anthropic's official [mcp-builder skill](https://github.com/anthropics/skills/tree/main/skills/mcp-builder) with Claude Code to wrap the [Framer Server API](https://www.framer.com/developers/server-api-introduction) as an MCP server.

I hope it helps and you have fun with it.

Best,  
Max

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
7. Do not print, log, or expose my Framer API key.
8. Restart or tell me to restart the MCP client.
9. Verify the server by calling the framer_status tool.
```

## Context usage

This MCP server exposes a lot of tools. It is not optimized for context efficiency yet, so sessions where this MCP is connected may load many tool definitions and use valuable agent context.

If you only need Framer access sometimes, a practical workaround is to configure this MCP only in a dedicated folder, for example a folder named `Framer`, and start Claude Code, Codex, or your other agent from that folder only when you want it to work on your Framer site.

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

## Contact

If you have any questions or are interested in custom AI and marketing solutions, I would be happy to hear from you.

Companies:

- [CYP Media - Marketing Agency](https://www.cyp.media/) / [German site](https://de.cyp.media/)
- [CYP Dev - AI & Development Agency](https://cyp.dev/)

Socials:

- YouTube: [KI Kurve - AI News & Tutorials (DE)](https://www.youtube.com/@KI-Kurve)
- YouTube: [Max Weissenbaeck](https://www.youtube.com/@max.weissenbaeck)
- Instagram: [@max.weissenbaeck](https://www.instagram.com/max.weissenbaeck/)
- LinkedIn: [Maximilian Weissenbaeck](https://www.linkedin.com/in/maximilian-wei%C3%9Fenb%C3%A4ck/)

## License

MIT
