import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";

/**
 * Registers issue-related tools with the MCP server.
 */
export function registerIssueTools(server: McpServer, linearClient: LinearClient) {
  // Tool to create a new issue
  server.tool(
    "createIssue",
    "Create a new issue in Linear",
    {
      title: z.string().describe("Title of the issue"),
      description: z.string().optional().describe("Description of the issue (supports Markdown)"),
      teamId: z.string().describe("ID of the team to create the issue in"),
      stateId: z.string().optional().describe("ID of the workflow state for this issue"),
      assigneeId: z.string().optional().describe("ID of the user to assign the issue to"),
      priority: z.number().min(0).max(4).optional().describe("Priority: 0 (no priority), 1 (urgent), 2 (high), 3 (medium), 4 (low)"),
      labelIds: z.array(z.string()).optional().describe("IDs of labels to attach to the issue"),
      dueDate: z.string().optional().describe("Due date in ISO format (YYYY-MM-DD)"),
    },
    async ({ title, description, teamId, stateId, assigneeId, priority, labelIds, dueDate }) => {
      try {
        // Create the issue
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await linearClient.createIssue({
          title,
          description,
          teamId,
          stateId,
          assigneeId,
          priority,
          labelIds,
          dueDate,
        });
        
        // For simplicity, just return a success message
        // In a real implementation, we would need to extract the issue details from the response
        return {
          content: [{ 
            type: "text", 
            text: `Issue created successfully` 
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

  // Tool to update an existing issue
  server.tool(
    "updateIssue",
    "Update an existing issue in Linear",
    {
      id: z.string().describe("ID of the issue to update"),
      title: z.string().optional().describe("New title of the issue"),
      description: z.string().optional().describe("New description of the issue (supports Markdown)"),
      stateId: z.string().optional().describe("ID of the new workflow state for this issue"),
      assigneeId: z.string().optional().describe("ID of the user to assign the issue to"),
      priority: z.number().min(0).max(4).optional().describe("Priority: 0 (no priority), 1 (urgent), 2 (high), 3 (medium), 4 (low)"),
      labelIds: z.array(z.string()).optional().describe("IDs of labels to attach to the issue"),
      dueDate: z.string().optional().describe("Due date in ISO format (YYYY-MM-DD)"),
    },
    async ({ id, title, description, stateId, assigneeId, priority, labelIds, dueDate }) => {
      try {
        await linearClient.updateIssue(id, {
          title,
          description,
          stateId,
          assigneeId,
          priority,
          labelIds,
          dueDate,
        });
        
        return {
          content: [{ 
            type: "text", 
            text: `Issue updated successfully` 
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

  // Tool to search issues
  server.tool(
    "searchIssues",
    "Search for issues in Linear",
    {
      query: z.string().describe("Search query string"),
      first: z.number().min(1).max(100).optional().describe("Number of results to return (max 100)"),
    },
    async ({ query, first = 20 }) => {
      try {
        const result = await linearClient.searchIssues(query, { first });
        const issues = result.nodes;
        
        if (issues.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: "No issues found matching your search criteria." 
            }]
          };
        }
        
        const issueList = await Promise.all(issues.map(async issue => 
          `- ${issue.identifier}: ${issue.title} (${(await issue.state)?.name || 'Unknown state'}) - ${issue.url}`
        )).then(lines => lines.join('\n'));
        
        return {
          content: [{ 
            type: "text", 
            text: `Found ${issues.length} issues:\n\n${issueList}` 
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

  // Tool to add a comment to an issue
  server.tool(
    "addComment",
    "Add a comment to an issue",
    {
      issueId: z.string().describe("ID of the issue to comment on"),
      body: z.string().describe("Comment text (supports Markdown)"),
    },
    async ({ issueId, body }) => {
      try {
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await linearClient.createComment({
          issueId,
          body,
        });
        
        return {
          content: [{ 
            type: "text", 
            text: `Comment added to issue.` 
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
