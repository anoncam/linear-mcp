import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { LinearClient } from "./linear/client.js";

// Import resource registrations
import { registerIssueResources } from "./resources/issues.js";
import { registerTeamResources } from "./resources/teams.js";
import { registerProjectResources } from "./resources/projects.js";
import { registerUserResources } from "./resources/users.js";

// Import tool registrations
import { registerIssueTools } from "./tools/issues.js";

// Load environment variables
dotenv.config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error("Error: LINEAR_API_KEY environment variable is required");
  process.exit(1);
}

async function main() {
  // We've already checked that LINEAR_API_KEY is defined
  const apiKey = LINEAR_API_KEY as string;
  try {
    // Create the Linear client
    const linearClient = new LinearClient(apiKey);
    
    // Create a minimal MCP server
    const server = new McpServer({
      name: "Linear MCP",
      version: "1.0.0"
    }, {
      instructions: `
This server provides access to Linear, a project management tool.

Resources:
- Issues: View and list issues
- Teams: View team information, members, states
- Projects: View and list projects
- Users: View user information

Tools:
- Issues: Create, update, search issues, and add comments
- Projects: Create, update, and add issues to projects
- Initiatives: Create initiatives and link/unlink projects
- Search: Search across issues, projects, and users

Prompts:
- Issue templates: Create issues, bug reports, and feature requests
- Project templates: Create projects, plan projects with issues, and create status updates

This MCP server allows you to interact with Linear directly from Claude.
      `
    });

    // Register resources
    registerIssueResources(server, linearClient);
    registerTeamResources(server, linearClient);
    registerProjectResources(server, linearClient);
    registerUserResources(server, linearClient);

    // Register tools
    registerIssueTools(server, linearClient);
    
    // Import and register additional tools
    const { registerProjectTools } = await import("./tools/projects.js");
    const { registerSearchTools } = await import("./tools/search.js");
    const { registerInitiativeTools } = await import("./tools/initiatives.js");
    
    registerProjectTools(server, linearClient);
    registerSearchTools(server, linearClient);
    registerInitiativeTools(server, linearClient);
    
    // Import and register prompts if available
    try {
      const { registerIssuePrompts } = await import("./prompts/issues.js");
      const { registerProjectPrompts } = await import("./prompts/projects.js");
      
      registerIssuePrompts(server, linearClient);
      registerProjectPrompts(server, linearClient);
    } catch (error) {
      console.log("Prompts not available or could not be loaded");
    }

    // Create a transport
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(transport);
    
    console.log("Linear MCP server started with all tools and resources");
  } catch (error) {
    console.error("Error starting Linear MCP server:", error);
    process.exit(1);
  }
}

// Run the main function
main();
