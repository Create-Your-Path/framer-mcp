import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FramerConnection } from "../connection.js";
import { text, truncate } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

export function registerLocalizationTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_get_locales",
    {
      title: "Get Locales",
      description: `Get all locales and localization groups in the project.

Returns locale codes, names, slugs, and localization group summaries.`,
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
          const locales = await framer.getLocales();
          const defaultLocale = await framer.getDefaultLocale();
          const groups = await framer.getLocalizationGroups();

          const lines = [`# Localization\n`];
          lines.push(`## Locales (${locales.length})`);
          for (const l of locales) {
            const isDefault = l.id === (defaultLocale as any).id ? " **(default)**" : "";
            lines.push(`- **${l.name}** (\`${l.code}\`) — slug: /${l.slug}${isDefault}`);
          }

          if (groups.length > 0) {
            lines.push(`\n## Localization Groups (${groups.length})`);
            for (const g of groups) {
              lines.push(`- **${g.name}** (${g.type}) — ${g.sources.length} sources`);
            }
          }

          return text(truncate(lines.join("\n")));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_set_localization_data",
    {
      title: "Set Localization Data",
      description: `Update localized values for sources across locales.

Args:
  - updates: Object mapping source IDs to locale updates
    Each locale update is: { "action": "set", "value": "translated text" } or { "action": "clear" }

Example:
  {
    "source_id_1": {
      "locale_id_fr": { "action": "set", "value": "Bonjour" }
    }
  }`,
      inputSchema: {
        updates: z.record(
          z.record(
            z.object({
              action: z.enum(["set", "clear"]).describe("'set' to provide a value, 'clear' to fallback"),
              value: z.string().optional().describe("Translated value (required for 'set')"),
            })
          )
        ).describe("Source ID → Locale ID → update"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ updates }) => {
      try {
        return await connection.exec(async (framer) => {
          const result = await framer.setLocalizationData({
            valuesBySource: updates as any,
          });

          const errors = result.valuesBySource?.errors ?? [];
          if (errors.length > 0) {
            const lines = ["# Localization Update — Errors\n"];
            for (const e of errors) {
              lines.push(`- Source \`${e.sourceId}\`, Locale \`${e.localeId}\`: ${e.error}`);
            }
            return text(lines.join("\n"));
          }

          return text(`Localization data updated successfully for ${Object.keys(updates).length} source(s).`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
