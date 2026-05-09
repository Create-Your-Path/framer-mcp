import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FramerConnection } from "./connection.js";
import { registerProjectTools } from "./tools/project.js";
import { registerCollectionTools } from "./tools/collections.js";
import { registerPublishingTools } from "./tools/publishing.js";
import { registerCanvasNodeTools } from "./tools/canvas-nodes.js";
import { registerPageTools } from "./tools/pages.js";
import { registerStyleTools } from "./tools/styles.js";
import { registerCodeTools } from "./tools/code.js";
import { registerAssetTools } from "./tools/assets.js";
import { registerLocalizationTools } from "./tools/localization.js";
import { registerSiteSettingsTools } from "./tools/site-settings.js";

export function createMcpServer(connection: FramerConnection): McpServer {
  const server = new McpServer({
    name: "framer-mcp-server",
    version: "0.1.0",
  });

  registerProjectTools(server, connection);
  registerCollectionTools(server, connection);
  registerPublishingTools(server, connection);
  registerCanvasNodeTools(server, connection);
  registerPageTools(server, connection);
  registerStyleTools(server, connection);
  registerCodeTools(server, connection);
  registerAssetTools(server, connection);
  registerLocalizationTools(server, connection);
  registerSiteSettingsTools(server, connection);

  return server;
}
