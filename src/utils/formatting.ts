import { CHARACTER_LIMIT } from "../constants.js";

export function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

export function truncate(content: string): string {
  if (content.length <= CHARACTER_LIMIT) return content;
  return content.slice(0, CHARACTER_LIMIT) + "\n\n... (truncated)";
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace("T", " ").slice(0, 19);
}
