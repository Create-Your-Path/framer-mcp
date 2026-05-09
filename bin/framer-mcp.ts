#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FramerConnection } from "../src/connection.js";
import { createMcpServer } from "../src/server.js";

const projectUrl = process.env.FRAMER_PROJECT_URL;
const apiKey = process.env.FRAMER_API_KEY;

if (!projectUrl) {
  console.error("ERROR: FRAMER_PROJECT_URL environment variable is required.");
  console.error("Set it to your Framer project URL (e.g., https://framer.com/projects/Site--abc123)");
  process.exit(1);
}

if (!apiKey) {
  console.error("ERROR: FRAMER_API_KEY environment variable is required.");
  console.error("Generate one in Framer > Site Settings > General.");
  process.exit(1);
}

const connection = new FramerConnection(projectUrl, apiKey);
const server = createMcpServer(connection);
const transport = new StdioServerTransport();

// Cleanup on exit
async function cleanup() {
  await connection.disconnect();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

await server.connect(transport);
console.error("Framer MCP server running via stdio");
