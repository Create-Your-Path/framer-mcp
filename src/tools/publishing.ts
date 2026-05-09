import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FramerConnection } from "../connection.js";
import { text, formatDate } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

export function registerPublishingTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_get_changed_paths",
    {
      title: "Get Changed Paths",
      description: `Show pages and assets that have changed since the last publish.

Returns categorized lists of added, modified, and removed paths.`,
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
          const changes = await (framer as any).getChangedPaths();

          const lines = ["# Changed Paths\n"];

          if (changes.added?.length) {
            lines.push(`## Added (${changes.added.length})`);
            for (const p of changes.added) lines.push(`- ${p}`);
            lines.push("");
          }
          if (changes.modified?.length) {
            lines.push(`## Modified (${changes.modified.length})`);
            for (const p of changes.modified) lines.push(`- ${p}`);
            lines.push("");
          }
          if (changes.removed?.length) {
            lines.push(`## Removed (${changes.removed.length})`);
            for (const p of changes.removed) lines.push(`- ${p}`);
            lines.push("");
          }

          const total = (changes.added?.length ?? 0) + (changes.modified?.length ?? 0) + (changes.removed?.length ?? 0);
          if (total === 0) {
            lines.push("No changes since last publish.");
          }

          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_get_publish_info",
    {
      title: "Get Publish Info",
      description: `Get the current publish status including staging and production URLs.

Returns deployment times, URLs, and optimization status.`,
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
          const info = await framer.getPublishInfo();

          const lines = ["# Publish Info\n"];

          if (info.production) {
            lines.push("## Production");
            lines.push(`- **URL**: ${info.production.url}`);
            lines.push(`- **Deployed**: ${formatDate(info.production.deploymentTime)}`);
            lines.push(`- **Optimization**: ${info.production.optimizationStatus}`);
            lines.push("");
          } else {
            lines.push("## Production\nNot yet published.\n");
          }

          if (info.staging) {
            lines.push("## Staging");
            lines.push(`- **URL**: ${info.staging.url}`);
            lines.push(`- **Deployed**: ${formatDate(info.staging.deploymentTime)}`);
            lines.push(`- **Optimization**: ${info.staging.optimizationStatus}`);
          } else {
            lines.push("## Staging\nNo staging deployment.");
          }

          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_publish",
    {
      title: "Publish",
      description: `Publish current changes to a staging preview URL.

This creates a new deployment that can be previewed before going to production. Use framer_deploy to promote it.

Returns the deployment ID and preview hostnames.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        return await connection.exec(async (framer) => {
          const result = await (framer as any).publish();

          const lines = [
            "# Published Successfully",
            "",
            `- **Deployment ID**: \`${result.deployment.id}\``,
          ];

          if (result.hostnames?.length) {
            lines.push("- **Hostnames**:");
            for (const h of result.hostnames) {
              lines.push(`  - ${h.hostname} (${h.type}${h.isPrimary ? ", primary" : ""})`);
            }
          }

          lines.push("");
          lines.push("Use `framer_deploy` with this deployment ID to promote to production.");

          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_deploy",
    {
      title: "Deploy to Production",
      description: `Promote a published deployment to production on custom domains.

Args:
  - deployment_id: The deployment ID from a previous publish
  - domains: Optional list of specific domains to deploy to (deploys to all if omitted)`,
      inputSchema: {
        deployment_id: z.string().describe("Deployment ID from framer_publish"),
        domains: z.array(z.string()).optional().describe("Specific domains to deploy to"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ deployment_id, domains }) => {
      try {
        return await connection.exec(async (framer) => {
          const hostnames = await (framer as any).deploy(deployment_id, domains);

          const lines = [
            "# Deployed to Production",
            "",
            `- **Deployment**: \`${deployment_id}\``,
            "- **Hostnames**:",
          ];

          if (Array.isArray(hostnames)) {
            for (const h of hostnames) {
              lines.push(`  - ${h.hostname} (${h.type})`);
            }
          }

          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
