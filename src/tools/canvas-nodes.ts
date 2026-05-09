import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FramerConnection } from "../connection.js";
import { text, truncate } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

function serializeNode(node: any): string {
  const lines: string[] = [];
  lines.push(`- **Type**: ${node.constructor?.name ?? "Unknown"}`);
  lines.push(`- **ID**: \`${node.id}\``);
  if (node.name) lines.push(`- **Name**: ${node.name}`);
  if (node.visible !== undefined) lines.push(`- **Visible**: ${node.visible}`);
  if (node.locked !== undefined) lines.push(`- **Locked**: ${node.locked}`);
  if (node.width !== undefined) lines.push(`- **Width**: ${node.width}`);
  if (node.height !== undefined) lines.push(`- **Height**: ${node.height}`);
  if (node.opacity !== undefined) lines.push(`- **Opacity**: ${node.opacity}`);
  if (node.rotation !== undefined) lines.push(`- **Rotation**: ${node.rotation}`);
  if (node.backgroundColor) lines.push(`- **Background**: ${node.backgroundColor}`);
  if (node.link) lines.push(`- **Link**: ${node.link}`);
  if (node.componentName) lines.push(`- **Component**: ${node.componentName}`);
  return lines.join("\n");
}

export function registerCanvasNodeTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_get_node",
    {
      title: "Get Node",
      description: `Get a canvas node by its ID with all properties.

Args:
  - node_id: The node ID

Returns all available properties for the node type.`,
      inputSchema: {
        node_id: z.string().describe("The node ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ node_id }) => {
      try {
        return await connection.exec(async (framer) => {
          const node = await framer.getNode(node_id);
          if (!node) return text(`Node '${node_id}' not found.`);
          return text(`# Node: ${(node as any).name ?? node_id}\n\n${serializeNode(node)}`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_get_children",
    {
      title: "Get Children",
      description: `Get the child nodes of a parent node.

Args:
  - node_id: The parent node ID

Returns a list of child nodes with their types and names.`,
      inputSchema: {
        node_id: z.string().describe("The parent node ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ node_id }) => {
      try {
        return await connection.exec(async (framer) => {
          const children = await framer.getChildren(node_id);
          const lines = [`# Children of \`${node_id}\` (${children.length})\n`];
          for (const child of children) {
            lines.push(`### ${(child as any).name ?? child.id}`);
            lines.push(serializeNode(child));
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
    "framer_get_nodes_by_type",
    {
      title: "Get Nodes by Type",
      description: `Get all nodes of a specific type in the project.

Args:
  - node_type: One of: FrameNode, TextNode, SVGNode, ComponentInstanceNode, WebPageNode, DesignPageNode, ComponentNode

Returns a list of matching nodes.`,
      inputSchema: {
        node_type: z.enum([
          "FrameNode", "TextNode", "SVGNode", "ComponentInstanceNode",
          "WebPageNode", "DesignPageNode", "ComponentNode",
        ]).describe("The node type to search for"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ node_type }) => {
      try {
        return await connection.exec(async (framer) => {
          const nodes = await framer.getNodesWithType(node_type as any);
          const lines = [`# ${node_type} nodes (${nodes.length})\n`];
          for (const node of nodes) {
            lines.push(`- **${(node as any).name ?? "Unnamed"}** (\`${node.id}\`)`);
          }
          return text(truncate(lines.join("\n")));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_create_frame",
    {
      title: "Create Frame",
      description: `Create a new frame node on the canvas.

Args:
  - name: Display name for the frame
  - parent_id: Optional parent node ID
  - width: Optional width in pixels
  - height: Optional height in pixels
  - background_color: Optional background color (RGBA string)

Returns the created frame's ID and properties.`,
      inputSchema: {
        name: z.string().describe("Frame name"),
        parent_id: z.string().optional().describe("Parent node ID"),
        width: z.number().optional().describe("Width in pixels"),
        height: z.number().optional().describe("Height in pixels"),
        background_color: z.string().optional().describe("Background color (RGBA)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, parent_id, width, height, background_color }) => {
      try {
        return await connection.exec(async (framer) => {
          const attrs: Record<string, unknown> = { name };
          if (width !== undefined) attrs.width = width;
          if (height !== undefined) attrs.height = height;
          if (background_color) attrs.backgroundColor = background_color;

          const node = await framer.createFrameNode(attrs as any, parent_id);
          if (!node) return text("Failed to create frame node.");
          return text(`Created frame "${name}" with ID \`${node.id}\`.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_create_text",
    {
      title: "Create Text Node",
      description: `Create a new text node on the canvas.

Args:
  - content: The text content
  - name: Optional display name
  - parent_id: Optional parent node ID

Returns the created text node's ID.`,
      inputSchema: {
        content: z.string().describe("Text content"),
        name: z.string().optional().describe("Display name"),
        parent_id: z.string().optional().describe("Parent node ID"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ content, name, parent_id }) => {
      try {
        return await connection.exec(async (framer) => {
          const attrs: Record<string, unknown> = {};
          if (name) attrs.name = name;
          const node = await framer.createTextNode(attrs as any, parent_id);
          if (!node) return text("Failed to create text node.");
          await framer.setText(content);
          return text(`Created text node "${name ?? content.slice(0, 30)}" with ID \`${node.id}\`.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_set_attributes",
    {
      title: "Set Node Attributes",
      description: `Update attributes on an existing canvas node.

Args:
  - node_id: The node ID to update
  - attributes: Object of attributes to set (name, visible, locked, width, height, opacity, rotation, backgroundColor, etc.)

Returns the updated node properties.`,
      inputSchema: {
        node_id: z.string().describe("Node ID to update"),
        attributes: z.record(z.unknown()).describe("Attributes to set"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ node_id, attributes }) => {
      try {
        return await connection.exec(async (framer) => {
          const updated = await framer.setAttributes(node_id, attributes as any);
          if (!updated) return text(`Failed to update node '${node_id}'.`);
          return text(`Updated node \`${node_id}\`:\n\n${serializeNode(updated)}`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_remove_nodes",
    {
      title: "Remove Nodes",
      description: `Remove one or more nodes from the canvas.

Args:
  - node_ids: Array of node IDs to remove

This is destructive and cannot be undone.`,
      inputSchema: {
        node_ids: z.array(z.string()).describe("Node IDs to remove"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ node_ids }) => {
      try {
        return await connection.exec(async (framer) => {
          await framer.removeNodes(node_ids);
          return text(`Removed ${node_ids.length} node(s).`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
