import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FramerConnection } from "../connection.js";
import { text, truncate } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

export function registerCodeTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_get_code_files",
    {
      title: "Get Code Files",
      description: `List all code files in the project with their exports.

Returns file names, paths, and exported components/overrides.`,
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
          const files = await framer.getCodeFiles();

          const lines = [`# Code Files (${files.length})\n`];
          for (const f of files) {
            lines.push(`## ${f.name}`);
            lines.push(`- **ID**: \`${f.id}\``);
            lines.push(`- **Path**: ${f.path}`);
            if (f.exports.length > 0) {
              lines.push("- **Exports**:");
              for (const exp of f.exports) {
                lines.push(`  - ${exp.name} (${(exp as any).type ?? "unknown"}${(exp as any).isDefaultExport ? ", default" : ""})`);
              }
            }
            lines.push("");
          }

          return text(truncate(lines.join("\n")));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_get_code_file",
    {
      title: "Get Code File",
      description: `Get the full content and metadata of a code file.

Args:
  - file_id: The code file ID

Returns the file name, path, content, and exports.`,
      inputSchema: {
        file_id: z.string().describe("The code file ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ file_id }) => {
      try {
        return await connection.exec(async (framer) => {
          const files = await framer.getCodeFiles();
          const file = files.find((f) => f.id === file_id);

          if (!file) return text(`Code file '${file_id}' not found.`);

          const lines = [
            `# ${file.name}`,
            "",
            `- **Path**: ${file.path}`,
            `- **Version**: ${file.versionId}`,
            "",
            "## Content",
            "",
            "```tsx",
            file.content,
            "```",
          ];

          return text(truncate(lines.join("\n")));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_create_code_file",
    {
      title: "Create Code File",
      description: `Create a new code file in the project.

Args:
  - name: File name (e.g., "MyComponent.tsx")
  - content: The TypeScript/React source code

Returns the new file's ID.`,
      inputSchema: {
        name: z.string().describe("File name (e.g., 'MyComponent.tsx')"),
        content: z.string().describe("Source code content"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, content }) => {
      try {
        return await connection.exec(async (framer) => {
          const file = await (framer as any).createCodeFile(name, content);
          return text(`Created code file "${file.name}" with ID \`${file.id}\`.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_update_code_file",
    {
      title: "Update Code File",
      description: `Update the content of an existing code file.

Args:
  - file_id: The code file ID
  - content: New source code content

Returns the updated file info.`,
      inputSchema: {
        file_id: z.string().describe("The code file ID"),
        content: z.string().describe("New source code content"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ file_id, content }) => {
      try {
        return await connection.exec(async (framer) => {
          const files = await framer.getCodeFiles();
          const file = files.find((f) => f.id === file_id);

          if (!file) return text(`Code file '${file_id}' not found.`);

          const updated = await file.setFileContent(content);
          return text(`Updated "${updated.name}" (version: ${updated.versionId}).`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
