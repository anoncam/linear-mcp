import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "./linear/client.js";

// Import resource registrations
import { registerIssueResources } from "./resources/issues.js";
import { registerTeamResources } from "./resources/teams.js";
import { registerProjectResources } from "./resources/projects.js";
import { registerUserResources } from "./resources/users.js";
import { registerRoadmapResources } from "./resources/roadmap.js";
import { registerMilestoneResources } from "./resources/milestones.js";
import { registerDocumentResources } from "./resources/documents.js";
import { registerIntegrationResources } from "./resources/integrations.js";
import { registerOrganizationResources } from "./resources/organization.js";
import { registerInitiativeResources } from "./resources/initiatives.js";
import { registerCycleResources } from "./resources/cycles.js";
import { registerCommentResources } from "./resources/comments.js";

// Import tool registrations
import { registerIssueTools } from "./tools/issues.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerSearchTools } from "./tools/search.js";
import { registerInitiativeTools } from "./tools/initiatives.js";
import { registerCycleTools } from "./tools/cycles.js";
import { registerCommentTools } from "./tools/comments.js";

// Import prompt registrations
import { registerIssuePrompts } from "./prompts/issues.js";
import { registerProjectPrompts } from "./prompts/projects.js";
import { registerCyclePrompts } from "./prompts/cycles.js";

/**
 * Creates and configures an MCP server for Linear integration.
 * 
 * @param linearApiKey - The Linear API key, should be loaded from .env file by the calling code
 * @returns A configured MCP server instance
 */
export async function createServer(linearApiKey: string): Promise<McpServer> {
  if (!linearApiKey) {
    throw new Error("Linear API key is required");
  }

  // Create the Linear client
  const linearClient = new LinearClient(linearApiKey);

  // Create MCP server
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
- Roadmaps: View roadmaps and their details
- Milestones: View project milestones
- Documents: View documents and their contents
- Integrations: View available and active integrations
- Organization: View details about the organization
- Initiatives: View initiatives and related projects
- Cycles: View sprints/cycles and their issues
- Comments: View comments on issues and threads

Tools:
- Create, update, and search issues
- Create and update projects
- Add issues to projects
- Create and manage initiatives
- Link projects to initiatives
- Create and manage cycles/sprints
- Add issues to cycles
- Create, update, and delete comments
- Add reactions to comments
- Comprehensive search functionality

Use the resources to browse Linear data and tools to make changes.
  `
  });

  // Register resources
  registerIssueResources(server, linearClient);
  registerTeamResources(server, linearClient);
  registerProjectResources(server, linearClient);
  registerUserResources(server, linearClient);
  registerRoadmapResources(server, linearClient);
  registerMilestoneResources(server, linearClient);
  registerDocumentResources(server, linearClient);
  registerIntegrationResources(server, linearClient);
  registerOrganizationResources(server, linearClient);
  registerInitiativeResources(server, linearClient);
  registerCycleResources(server, linearClient);
  registerCommentResources(server, linearClient);

  // Register tools
  registerIssueTools(server, linearClient);
  registerProjectTools(server, linearClient);
  registerSearchTools(server, linearClient);
  registerInitiativeTools(server, linearClient);
  registerCycleTools(server, linearClient);
  registerCommentTools(server, linearClient);

  // Register prompts
  registerIssuePrompts(server, linearClient);
  registerProjectPrompts(server, linearClient);
  registerCyclePrompts(server, linearClient);

  return server;
}
