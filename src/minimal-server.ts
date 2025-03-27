import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error("Error: LINEAR_API_KEY environment variable is required");
  process.exit(1);
}

async function main() {
  try {
    // Create a minimal MCP server
    const server = new McpServer({
      name: "Linear MCP",
      version: "1.0.0"
    }, {
      instructions: `
This is a minimal Linear MCP server implementation for testing Claude Desktop integration.
Currently, only basic functionality is supported as we're working on fixing compatibility issues.
      `
    });

    // Register a simple resource
    server.resource("info", "linear://info", async (uri) => {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({
            title: "Linear MCP Info",
            description: "This is a minimal Linear MCP implementation for testing Claude Desktop integration.",
            apiKey: LINEAR_API_KEY ? "Configured" : "Not configured"
          }, null, 2),
          mimeType: "application/json"
        }]
      };
    });

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("Minimal Linear MCP server connected and ready!");
  } catch (error) {
    console.error("Error starting minimal Linear MCP server:", error);
    process.exit(1);
  }
}

main();
