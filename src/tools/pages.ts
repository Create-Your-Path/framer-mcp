import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FramerConnection } from "../connection.js";
import { text } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

export function registerPageTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_get_pages",
    {
      title: "Get Pages",
      description: `List all web pages and design pages in the project.

Returns page names, IDs, and types.`,
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
          const webPages = await framer.getNodesWithType("WebPageNode");
          const designPages = await framer.getNodesWithType("DesignPageNode");

          const lines = ["# Pages\n"];

          if (webPages.length > 0) {
            lines.push(`## Web Pages (${webPages.length})`);
            for (const p of webPages) {
              const path = (p as any).path ?? "/";
              const collectionId = (p as any).collectionId;
              const label = path || "/";
              const cms = collectionId ? ` (CMS: \`${collectionId}\`)` : "";
              lines.push(`- **${label}** (\`${p.id}\`)${cms}`);
            }
            lines.push("");
          }

          if (designPages.length > 0) {
            lines.push(`## Design Pages (${designPages.length})`);
            for (const p of designPages) {
              lines.push(`- **${(p as any).name ?? "Unnamed"}** (\`${p.id}\`)`);
            }
          }

          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_create_web_page",
    {
      title: "Create Web Page",
      description: `Create a new web page at a given URL path.

Args:
  - path: The URL path (e.g., "/about", "/blog")

Returns the new page's ID.`,
      inputSchema: {
        path: z.string().describe("URL path for the page (e.g., '/about')"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ path }) => {
      try {
        return await connection.exec(async (framer) => {
          const page = await (framer as any).createWebPage(path);
          if (!page) return text("Failed to create web page.");
          return text(`Created web page at "${path}" with ID \`${page.id}\`.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_create_design_page",
    {
      title: "Create Design Page",
      description: `Create a new design page (non-routable canvas page).

Args:
  - name: Name for the design page

Returns the new page's ID.`,
      inputSchema: {
        name: z.string().describe("Name for the design page"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ name }) => {
      try {
        return await connection.exec(async (framer) => {
          const page = await (framer as any).createDesignPage(name);
          if (!page) return text("Failed to create design page.");
          return text(`Created design page "${name}" with ID \`${page.id}\`.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
