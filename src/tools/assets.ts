import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FramerConnection } from "../connection.js";
import { text } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

export function registerAssetTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_upload_image",
    {
      title: "Upload Image",
      description: `Upload an image to the project by URL.

Args:
  - url: URL of the image to upload
  - name: Display name for the image
  - alt_text: Optional alt text for accessibility

Returns the uploaded image asset ID and URL.`,
      inputSchema: {
        url: z.string().describe("Image URL to upload"),
        name: z.string().describe("Display name"),
        alt_text: z.string().optional().describe("Alt text"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ url, name, alt_text }) => {
      try {
        return await connection.exec(async (framer) => {
          const asset = await framer.uploadImage({
            url,
            name,
            ...(alt_text ? { altText: alt_text } : {}),
          } as any);
          return text(
            `Uploaded image "${name}"\n` +
            `- **ID**: \`${asset.id}\`\n` +
            `- **URL**: ${asset.url}`
          );
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_upload_file",
    {
      title: "Upload File",
      description: `Upload a file asset to the project by URL.

Args:
  - url: URL of the file to upload
  - name: Display name for the file

Returns the uploaded file asset ID and URL.`,
      inputSchema: {
        url: z.string().describe("File URL to upload"),
        name: z.string().describe("Display name"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ url, name }) => {
      try {
        return await connection.exec(async (framer) => {
          const asset = await framer.uploadFile({ url, name } as any);
          return text(
            `Uploaded file "${name}"\n` +
            `- **ID**: \`${asset.id}\`\n` +
            `- **URL**: ${asset.url}`
          );
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
