export function handleError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("UNAUTHORIZED")) {
      return "Error: Invalid API key. Check your FRAMER_API_KEY.";
    }
    if (error.message.includes("PROJECT_CLOSED")) {
      return "Error: Project connection closed. Try again.";
    }
    if (error.message.includes("TIMEOUT")) {
      return "Error: Request timed out. The Framer server may be cold-starting — try again.";
    }
    if (error.message.includes("NODE_NOT_FOUND")) {
      return "Error: Node not found. Check the node ID is correct.";
    }
    return `Error: ${error.message}`;
  }
  return `Error: ${String(error)}`;
}
