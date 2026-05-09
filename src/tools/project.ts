import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FramerConnection } from "../connection.js";
import { text } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

export function registerProjectTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_status",
    {
      title: "Framer Status",
      description: `Check the connection status to the Framer project.

Returns connection state, project URL, and current mode.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return await connection.exec(async (framer) => {
          const info = await framer.getProjectInfo();
          const user = await framer.getCurrentUser();
          const lines = [
            "# Framer Status",
            "",
            `- **Connected**: Yes`,
            `- **Project**: ${info.name}`,
            `- **Project URL**: ${connection.url}`,
            `- **Mode**: ${framer.mode}`,
            `- **User**: ${user.name} (${user.id.slice(0, 8)}...)`,
          ];
          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_get_project_info",
    {
      title: "Get Project Info",
      description: `Get metadata about the connected Framer project.

Returns project name, ID, and current publish status.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return await connection.exec(async (framer) => {
          const info = await framer.getProjectInfo();
          const publishInfo = await framer.getPublishInfo();

          const lines = [
            `# ${info.name}`,
            "",
            `- **Project ID**: ${info.id}`,
          ];

          if (publishInfo.production) {
            lines.push(`- **Production URL**: ${publishInfo.production.url}`);
            lines.push(`- **Last deployed**: ${new Date(publishInfo.production.deploymentTime).toISOString()}`);
          }
          if (publishInfo.staging) {
            lines.push(`- **Staging URL**: ${publishInfo.staging.url}`);
          }

          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_get_current_user",
    {
      title: "Get Current User",
      description: `Get info about the authenticated user.

Returns name, ID, avatar URL, and initials.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        return await connection.exec(async (framer) => {
          const user = await framer.getCurrentUser();
          const lines = [
            `# User: ${user.name}`,
            "",
            `- **ID**: ${user.id}`,
            `- **Initials**: ${user.initials}`,
            ...(user.avatarUrl ? [`- **Avatar**: ${user.avatarUrl}`] : []),
          ];
          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
