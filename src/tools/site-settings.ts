import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FramerConnection } from "../connection.js";
import { text, truncate } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

export function registerSiteSettingsTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_get_redirects",
    {
      title: "Get Redirects",
      description: `List all URL redirects configured for the site.

Returns redirect sources, destinations, and IDs.`,
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
          const redirects = await framer.getRedirects();

          const lines = [`# Redirects (${redirects.length})\n`];
          for (const r of redirects) {
            lines.push(`- \`${(r as any).from}\` → \`${(r as any).to}\` (ID: \`${(r as any).id}\`)`);
          }

          if (redirects.length === 0) lines.push("No redirects configured.");

          return text(truncate(lines.join("\n")));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_manage_redirects",
    {
      title: "Manage Redirects",
      description: `Add or remove URL redirects.

Args:
  - add: Array of redirects to add (each with "from" path and "to" URL)
  - remove: Array of redirect IDs to remove`,
      inputSchema: {
        add: z.array(z.object({
          from: z.string().describe("Source path (e.g., '/old-page')"),
          to: z.string().describe("Destination URL (e.g., '/new-page' or 'https://example.com')"),
        })).optional().describe("Redirects to add"),
        remove: z.array(z.string()).optional().describe("Redirect IDs to remove"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ add, remove }) => {
      try {
        return await connection.exec(async (framer) => {
          const results: string[] = [];

          if (add?.length) {
            await framer.addRedirects(add as any);
            results.push(`Added ${add.length} redirect(s).`);
          }

          if (remove?.length) {
            // Redirects need to be removed individually via their object
            const redirects = await framer.getRedirects();
            for (const id of remove) {
              const r = redirects.find((r: any) => r.id === id);
              if (r) await (r as any).remove();
            }
            results.push(`Removed ${remove.length} redirect(s).`);
          }

          return text(results.join("\n") || "No changes made.");
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_manage_custom_code",
    {
      title: "Manage Custom Code",
      description: `Get or set custom code snippets injected into the site's HTML.

Args:
  - action: "get" to read current custom code, "set" to update it
  - location: Where to inject: headStart, headEnd, bodyStart, bodyEnd
  - html: The HTML/JS to inject (required for "set")`,
      inputSchema: {
        action: z.enum(["get", "set"]).describe("'get' or 'set'"),
        location: z.enum(["headStart", "headEnd", "bodyStart", "bodyEnd"]).optional()
          .describe("Injection point (required for 'set')"),
        html: z.string().optional().describe("HTML content to inject (required for 'set')"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ action, location, html }) => {
      try {
        return await connection.exec(async (framer) => {
          if (action === "get") {
            const code = await framer.getCustomCode();
            const lines = ["# Custom Code\n"];
            for (const loc of ["headStart", "headEnd", "bodyStart", "bodyEnd"] as const) {
              const entry = (code as any)[loc];
              if (entry?.html) {
                lines.push(`## ${loc}`);
                lines.push("```html");
                lines.push(entry.html);
                lines.push("```");
                lines.push("");
              }
            }
            if (lines.length === 1) lines.push("No custom code configured.");
            return text(lines.join("\n"));
          }

          if (!location || !html) {
            return text("Error: 'location' and 'html' are required for 'set' action.");
          }

          await framer.setCustomCode({ [location]: { html } } as any);
          return text(`Custom code updated at ${location}.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
