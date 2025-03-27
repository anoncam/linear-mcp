import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";

/**
 * Registers project-related tools with the MCP server.
 */
export function registerProjectTools(server: McpServer, linearClient: LinearClient) {
  // Tool to create a new project
  server.tool(
    "createProject",
    "Create a new project in Linear",
    {
      name: z.string().describe("Name of the project"),
      description: z.string().optional().describe("Description of the project (supports Markdown)"),
      teamId: z.string().describe("ID of the team to create the project in"),
      state: z.enum(["backlog", "planned", "started", "completed", "canceled"]).optional().describe("State of the project"),
      targetDate: z.string().optional().describe("Target date in ISO format (YYYY-MM-DD)"),
    },
    async ({ name, description, teamId, state, targetDate }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.createProject({
          name,
          description,
          teamIds: [teamId], // Use teamIds array instead of teamId
          state,
          targetDate,
        });
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const project = result.project;
        
        return {
          content: [{ 
            type: "text", 
            // @ts-ignore - The Linear SDK types may not be up to date
            text: `Project created: ${project.name}` 
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

  // Tool to update an existing project
  server.tool(
    "updateProject",
    "Update an existing project in Linear",
    {
      id: z.string().describe("ID of the project to update"),
      name: z.string().optional().describe("New name of the project"),
      description: z.string().optional().describe("New description of the project (supports Markdown)"),
      state: z.enum(["backlog", "planned", "started", "completed", "canceled"]).optional().describe("New state of the project"),
      targetDate: z.string().optional().describe("New target date in ISO format (YYYY-MM-DD)"),
    },
    async ({ id, name, description, state, targetDate }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.updateProject(id, {
          name,
          description,
          state,
          targetDate,
        });
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const project = result.project;
        
        return {
          content: [{ 
            type: "text", 
            // @ts-ignore - The Linear SDK types may not be up to date
            text: `Project updated: ${project.name}` 
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

  // Tool to add an issue to a project
  server.tool(
    "addIssueToProject",
    "Add an existing issue to a project",
    {
      issueId: z.string().describe("ID of the issue to add to the project"),
      projectId: z.string().describe("ID of the project to add the issue to"),
    },
    async ({ issueId, projectId }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // @ts-ignore - The Linear SDK types may not be up to date
        await rawClient.updateIssue(issueId, {
          projectId,
        });
        
        return {
          content: [{ 
            type: "text", 
            text: `Issue added to project` 
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
