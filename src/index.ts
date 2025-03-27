import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "./server.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Request, Response } from "express";

// Load environment variables
dotenv.config();

const apiKey = process.env.LINEAR_API_KEY!;
const SERVER_PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3000;

if (!apiKey) {
  console.error("Error: LINEAR_API_KEY environment variable is required");
  process.exit(1);
}

async function main() {
  try {
    // Determine transport type based on environment
    const transportType = process.argv[2] || "stdio";
    
    if (transportType === "stdio") {
      // Start server with stdio transport (for command-line usage)
      console.error("Starting Linear MCP server with stdio transport...");
      
      const server = await createServer(apiKey);
      const transport = new StdioServerTransport();
      await server.connect(transport);
    } 
    else if (transportType === "http") {
      // Start server with HTTP/SSE transport (for remote usage)
      console.error(`Starting Linear MCP server with HTTP/SSE transport on port ${SERVER_PORT}...`);
      
      const app = express();
      app.use(cors());
      app.use(express.json());
      
      const server = await createServer(apiKey);
      
      // to support multiple simultaneous connections we have a lookup object from
      // sessionId to transport
      const transports: {[sessionId: string]: SSEServerTransport} = {};
      
      app.get("/sse", async (_: Request, res: Response) => {
        const transport = new SSEServerTransport('/messages', res);
        transports[transport.sessionId] = transport;
        
        res.on("close", () => {
          delete transports[transport.sessionId];
        });
        
        await server.connect(transport);
      });
      
      app.post("/messages", async (req: Request, res: Response) => {
        const sessionId = req.query.sessionId as string;
        const transport = transports[sessionId];
        
        if (transport) {
          await transport.handlePostMessage(req, res);
        } else {
          res.status(400).send('No transport found for sessionId');
        }
      });
      
      // Basic info endpoint
      app.get("/", (_: express.Request, res: express.Response) => {
        res.json({
          name: "Linear MCP",
          version: "1.0.0",
          description: "MCP server for Linear API integration",
          endpoints: {
            "/": "This info",
            "/sse": "Connect via Server-Sent Events",
            "/messages": "Send messages to the server"
          }
        });
      });
      
      app.listen(SERVER_PORT, () => {
        console.error(`Linear MCP server listening on port ${SERVER_PORT}`);
      });
    } 
    else {
      console.error(`Error: Unknown transport type "${transportType}". Use "stdio" or "http".`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error starting Linear MCP server:", error);
    process.exit(1);
  }
}

main();