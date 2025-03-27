import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";

/**
 * Registers initiative-related tools with the MCP server.
 */
export function registerInitiativeTools(server: McpServer, linearClient: LinearClient) {
  // Tool to create a new initiative
  server.tool(
    "createInitiative",
    "Create a new initiative in Linear",
    {
      name: z.string().describe("Name of the initiative"),
      description: z.string().optional().describe("Description of the initiative (supports Markdown)"),
      teamId: z.string().describe("ID of the team to create the initiative in"),
      state: z.enum(["backlog", "planned", "started", "completed", "canceled"]).optional().describe("State of the initiative"),
      targetDate: z.string().optional().describe("Target date in ISO format (YYYY-MM-DD)"),
    },
    async ({ name, description, teamId, state, targetDate }) => {
      try {
        // Use the raw client to create an initiative
        const rawClient = linearClient.getRawClient();
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.initiativeCreate({
          name,
          description,
          teamId,
          state,
          targetDate,
        });
        
        if (result.success) {
          const initiative = result.initiative;
          return {
            content: [{ 
              type: "text", 
              text: `Initiative "${name}" created successfully.\n\nID: ${initiative.id}\nURL: ${initiative.url}` 
            }]
          };
        } else {
          return {
            content: [{ 
              type: "text", 
              text: `Failed to create initiative: ${result.errors?.join(", ") || "Unknown error"}` 
            }],
            isError: true
          };
        }
      } catch (error: any) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error.message}` 
          }],
          isError: true
        };
      }
    }
  );

  // Tool to link a project to an initiative
  server.tool(
    "linkProjectToInitiative",
    "Link a project to an initiative in Linear",
    {
      initiativeId: z.string().describe("ID of the initiative"),
      projectId: z.string().describe("ID of the project to link"),
    },
    async ({ initiativeId, projectId }) => {
      try {
        // Use the raw client to link a project to an initiative
        const rawClient = linearClient.getRawClient();
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.initiativeProjectLinkCreate({
          initiativeId,
          projectId,
        });
        
        if (result.success) {
          return {
            content: [{ 
              type: "text", 
              text: `Project linked to initiative successfully.` 
            }]
          };
        } else {
          return {
            content: [{ 
              type: "text", 
              text: `Failed to link project to initiative: ${result.errors?.join(", ") || "Unknown error"}` 
            }],
            isError: true
          };
        }
      } catch (error: any) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error.message}` 
          }],
          isError: true
        };
      }
    }
  );

  // Tool to unlink a project from an initiative
  server.tool(
    "unlinkProjectFromInitiative",
    "Unlink a project from an initiative in Linear",
    {
      initiativeId: z.string().describe("ID of the initiative"),
      projectId: z.string().describe("ID of the project to unlink"),
    },
    async ({ initiativeId, projectId }) => {
      try {
        // Use the raw client to find the link
        const rawClient = linearClient.getRawClient();
        
        // First, find the initiative-project link
        // @ts-ignore - The Linear SDK types may not be up to date
        const initiative = await rawClient.initiative({ id: initiativeId });
        if (!initiative) {
          return {
            content: [{ 
              type: "text", 
              text: `Initiative not found with ID: ${initiativeId}` 
            }],
            isError: true
          };
        }
        
        // Get the projects linked to this initiative
        // @ts-ignore - The Linear SDK types may not be up to date
        const projectLinks = await initiative.projectLinks();
        // @ts-ignore - The Linear SDK types may not be up to date
        const linkToRemove = projectLinks.nodes.find((link: any) => link.project.id === projectId);
        
        if (!linkToRemove) {
          return {
            content: [{ 
              type: "text", 
              text: `Project with ID ${projectId} is not linked to this initiative.` 
            }],
            isError: true
          };
        }
        
        // Delete the link
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.initiativeProjectLinkDelete({
          id: linkToRemove.id,
        });
        
        if (result.success) {
          return {
            content: [{ 
              type: "text", 
              text: `Project unlinked from initiative successfully.` 
            }]
          };
        } else {
          return {
            content: [{ 
              type: "text", 
              text: `Failed to unlink project from initiative: ${result.errors?.join(", ") || "Unknown error"}` 
            }],
            isError: true
          };
        }
      } catch (error: any) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error.message}` 
          }],
          isError: true
        };
      }
    }
  );

  // Tool to list initiatives
  server.tool(
    "listInitiatives",
    "List initiatives in Linear",
    {
      teamId: z.string().optional().describe("Optional team ID to filter by"),
      state: z.enum(["backlog", "planned", "started", "completed", "canceled"]).optional().describe("Optional state to filter by"),
      first: z.number().min(1).max(100).optional().describe("Number of results to return (max 100)"),
    },
    async ({ teamId, state, first = 20 }) => {
      try {
        // Use the raw client to list initiatives
        const rawClient = linearClient.getRawClient();
        
        // Build the filter
        const filter: any = {};
        
        // Add team filter if provided
        if (teamId) {
          filter.team = { id: { eq: teamId } };
        }
        
        // Add state filter if provided
        if (state) {
          filter.state = { eq: state };
        }
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.initiatives({
          filter,
          first
        });
        
        const initiatives = result.nodes;
        
        if (initiatives.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No initiatives found${teamId ? ' in the specified team' : ''}${state ? ` with state "${state}"` : ''}.` 
            }]
          };
        }
        
        const initiativeList = initiatives.map((initiative: any) => 
          `- ${initiative.name} (${initiative.state || 'Unknown state'})${initiative.targetDate ? ` - Target: ${initiative.targetDate}` : ''} - ${initiative.url || 'No URL'}`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `Found ${initiatives.length} initiatives:\n\n${initiativeList}` 
          }]
        };
      } catch (error: any) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error.message}` 
          }],
          isError: true
        };
      }
    }
  );
}
