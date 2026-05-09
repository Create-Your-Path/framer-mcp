import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FramerConnection } from "../connection.js";
import { text, truncate } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

export function registerStyleTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_get_styles",
    {
      title: "Get Styles",
      description: `Get all color styles and text styles defined in the project.

Returns style names, IDs, values, and paths.`,
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
          const colorStyles = await framer.getColorStyles();
          const textStyles = await framer.getTextStyles();

          const lines = ["# Styles\n"];

          if (colorStyles.length > 0) {
            lines.push(`## Color Styles (${colorStyles.length})`);
            for (const s of colorStyles) {
              const dark = s.dark ? ` / dark: ${s.dark}` : "";
              lines.push(`- **${s.name}** (\`${s.id}\`) — ${s.light}${dark}`);
            }
            lines.push("");
          }

          if (textStyles.length > 0) {
            lines.push(`## Text Styles (${textStyles.length})`);
            for (const s of textStyles) {
              lines.push(`- **${s.name}** (\`${s.id}\`) — ${s.tag}, ${s.fontSize}, font: ${s.font?.family ?? "default"}`);
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
    "framer_create_color_style",
    {
      title: "Create Color Style",
      description: `Create a new color style in the project.

Args:
  - name: Style name (e.g., "Primary Blue")
  - light: Light mode color in RGBA format (e.g., "rgba(0, 100, 255, 1)")
  - dark: Optional dark mode color in RGBA format`,
      inputSchema: {
        name: z.string().describe("Style name"),
        light: z.string().describe("Light mode RGBA color"),
        dark: z.string().optional().describe("Dark mode RGBA color"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, light, dark }) => {
      try {
        return await connection.exec(async (framer) => {
          const attrs: Record<string, unknown> = { name, light };
          if (dark) attrs.dark = dark;
          const style = await (framer as any).createColorStyle(attrs as any);
          return text(`Created color style "${name}" with ID \`${style.id}\`.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_create_text_style",
    {
      title: "Create Text Style",
      description: `Create a new text style in the project.

Args:
  - name: Style name (e.g., "Heading 1")
  - tag: HTML tag (h1, h2, h3, h4, h5, h6, p)
  - font_family: Font family name
  - font_size: Font size (e.g., "32px", "2rem")
  - font_weight: Optional font weight (100-900)`,
      inputSchema: {
        name: z.string().describe("Style name"),
        tag: z.enum(["h1", "h2", "h3", "h4", "h5", "h6", "p"]).describe("HTML tag"),
        font_family: z.string().describe("Font family name"),
        font_size: z.string().describe("Font size with unit (e.g., '32px')"),
        font_weight: z.number().optional().describe("Font weight (100-900)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, tag, font_family, font_size, font_weight }) => {
      try {
        return await connection.exec(async (framer) => {
          const attrs: Record<string, unknown> = {
            name,
            tag,
            font: {
              family: font_family,
              weight: font_weight ?? 400,
              style: "normal",
            },
            fontSize: font_size,
          };
          const style = await (framer as any).createTextStyle(attrs as any);
          return text(`Created text style "${name}" with ID \`${style.id}\`.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
