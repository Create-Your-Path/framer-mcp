import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { FramerConnection } from "../connection.js";
import { text, truncate } from "../utils/formatting.js";
import { handleError } from "../utils/errors.js";

export function registerCollectionTools(server: McpServer, connection: FramerConnection): void {
  server.registerTool(
    "framer_get_collections",
    {
      title: "Get Collections",
      description: `List all CMS collections in the project.

Returns collection IDs, names, field counts, and managed status.`,
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
          const collections = await framer.getCollections();
          const managed = await framer.getManagedCollections();

          const lines = [`# Collections (${collections.length + managed.length})\n`];

          if (collections.length > 0) {
            lines.push("## User Collections");
            for (const c of collections) {
              const fields = await c.getFields();
              lines.push(`- **${c.name}** (ID: \`${c.id}\`) — ${fields.length} fields`);
            }
            lines.push("");
          }

          if (managed.length > 0) {
            lines.push("## Managed Collections");
            for (const c of managed) {
              const fields = await c.getFields();
              lines.push(`- **${c.name}** (ID: \`${c.id}\`) — ${fields.length} fields, managed by: ${c.managedBy}`);
            }
          }

          if (collections.length === 0 && managed.length === 0) {
            lines.push("No collections found.");
          }

          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_get_collection_fields",
    {
      title: "Get Collection Fields",
      description: `Get the field definitions (schema) for a collection.

Args:
  - collection_id: The ID of the collection

Returns field names, types, and IDs.`,
      inputSchema: {
        collection_id: z.string().describe("The collection ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ collection_id }) => {
      try {
        return await connection.exec(async (framer) => {
          const collections = await framer.getCollections();
          const managed = await framer.getManagedCollections();
          const col = [...collections, ...managed].find((c) => c.id === collection_id);

          if (!col) return text(`Error: Collection '${collection_id}' not found.`);

          const fields = await col.getFields();
          const lines = [`# Fields for "${col.name}"\n`];

          for (const f of fields) {
            lines.push(`- **${f.name}** (\`${f.id}\`) — type: \`${f.type}\``);
          }

          return text(lines.join("\n"));
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_get_collection_items",
    {
      title: "Get Collection Items",
      description: `Get all items in a CMS collection with their field data.

Args:
  - collection_id: The ID of the collection

Returns items with IDs, slugs, draft status, and field data.`,
      inputSchema: {
        collection_id: z.string().describe("The collection ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ collection_id }) => {
      try {
        return await connection.exec(async (framer) => {
          const collections = await framer.getCollections();
          const col = collections.find((c) => c.id === collection_id);

          if (!col) return text(`Error: Collection '${collection_id}' not found.`);

          const items = await col.getItems();
          const fields = await col.getFields();
          const fieldMap = new Map(fields.map((f) => [f.id, f.name]));

          const lines = [`# Items in "${col.name}" (${items.length})\n`];

          for (const item of items) {
            lines.push(`## ${item.slug} (ID: \`${item.id}\`)`);
            lines.push(`- **Draft**: ${item.draft}`);
            const data = item.fieldData;
            for (const [fieldId, value] of Object.entries(data)) {
              const fieldName = fieldMap.get(fieldId) ?? fieldId;
              lines.push(`- **${fieldName}**: ${JSON.stringify(value)}`);
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
    "framer_create_collection",
    {
      title: "Create Collection",
      description: `Create a new CMS collection in the project.

Args:
  - name: Name for the new collection
  - fields: Array of field definitions (each with name and type)

Supported field types: string, number, boolean, date, color, image, link, file, formattedText, enum.`,
      inputSchema: {
        name: z.string().describe("Name for the new collection"),
        fields: z.array(z.object({
          name: z.string().describe("Field name"),
          type: z.string().describe("Field type: string, number, boolean, date, color, image, link, file, formattedText, enum"),
        })).optional().describe("Optional initial field definitions"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, fields }) => {
      try {
        return await connection.exec(async (framer) => {
          const collections = await framer.getCollections();

          // Check if collection already exists
          const existing = collections.find((c) => c.name === name);
          if (existing) return text(`Collection "${name}" already exists (ID: ${existing.id}).`);

          // Create via addItems on a new collection — actually the API doesn't have createCollection
          // We need to use createManagedCollection for the server API
          const col = await (framer as any).createManagedCollection(name);

          if (fields && fields.length > 0) {
            await col.setFields(
              fields.map((f: { name: string; type: string }) => ({
                name: f.name,
                type: f.type,
                id: f.name.toLowerCase().replace(/\s+/g, "_"),
              }))
            );
          }

          const resultFields = await col.getFields();
          return text(
            `# Created Collection: ${name}\n\n` +
            `- **ID**: \`${col.id}\`\n` +
            `- **Fields**: ${resultFields.length}\n`
          );
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_upsert_collection_items",
    {
      title: "Upsert Collection Items",
      description: `Add or update items in a CMS collection.

If an item with the same slug exists, it will be updated. Otherwise a new item is created.

Args:
  - collection_id: The collection ID
  - items: Array of items, each with slug and field_data (mapping field IDs to values)

Each field_data value should be an object with "type" and "value":
  { "type": "string", "value": "hello" }
  { "type": "number", "value": 42 }
  { "type": "boolean", "value": true }`,
      inputSchema: {
        collection_id: z.string().describe("The collection ID"),
        items: z.array(z.object({
          id: z.string().optional().describe("Item ID (for updates)"),
          slug: z.string().describe("URL-friendly slug"),
          field_data: z.record(z.object({
            type: z.string(),
            value: z.unknown(),
          })).describe("Field data keyed by field ID"),
        })).describe("Items to add or update"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ collection_id, items }) => {
      try {
        return await connection.exec(async (framer) => {
          const collections = await framer.getCollections();
          const managed = await framer.getManagedCollections();
          const col = [...collections, ...managed].find((c) => c.id === collection_id);

          if (!col) return text(`Error: Collection '${collection_id}' not found.`);

          await col.addItems(
            items.map((item) => ({
              id: item.id ?? item.slug,
              slug: item.slug,
              fieldData: item.field_data as any,
            }))
          );

          return text(`Successfully upserted ${items.length} item(s) in collection \`${collection_id}\`.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );

  server.registerTool(
    "framer_remove_collection_items",
    {
      title: "Remove Collection Items",
      description: `Remove items from a CMS collection by their IDs.

Args:
  - collection_id: The collection ID
  - item_ids: Array of item IDs to remove`,
      inputSchema: {
        collection_id: z.string().describe("The collection ID"),
        item_ids: z.array(z.string()).describe("Item IDs to remove"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ collection_id, item_ids }) => {
      try {
        return await connection.exec(async (framer) => {
          const collections = await framer.getCollections();
          const managed = await framer.getManagedCollections();
          const col = [...collections, ...managed].find((c) => c.id === collection_id);

          if (!col) return text(`Error: Collection '${collection_id}' not found.`);

          await col.removeItems(item_ids);
          return text(`Removed ${item_ids.length} item(s) from collection \`${collection_id}\`.`);
        });
      } catch (error) {
        return text(handleError(error));
      }
    }
  );
}
