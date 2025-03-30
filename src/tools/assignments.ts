import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";
import { RelationshipManager } from "../utils/relationships.js";

/**
 * Registers assignment-related tools with the MCP server.
 */
export function registerAssignmentTools(server: McpServer, linearClient: LinearClient) {
  const relationshipManager = new RelationshipManager(linearClient);

  // Tool to assign an issue to a user
  server.tool(
    "assignIssue",
    "Assign an issue to a user in Linear",
    {
      issueId: z.string().describe("ID of the issue to assign"),
      userId: z.string().describe("ID of the user to assign the issue to"),
    },
    async ({ issueId, userId }) => {
      try {
        await relationshipManager.assignIssueToUser(issueId, userId);

        // Get user name for better response
        const user = await linearClient.getUser(userId);
        const issue = await linearClient.getIssue(issueId);

        return {
          content: [{
            type: "text",
            text: `Issue ${issue.identifier} successfully assigned to ${user.name}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error assigning issue: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool to unassign an issue
  server.tool(
    "unassignIssue",
    "Remove assignment from an issue in Linear",
    {
      issueId: z.string().describe("ID of the issue to unassign"),
    },
    async ({ issueId }) => {
      try {
        // Get issue details first for better response
        const issue = await linearClient.getIssue(issueId);
        const assignee = await issue.assignee;
        const assigneeName = assignee ? assignee.name : "No one";

        await relationshipManager.unassignIssue(issueId);

        return {
          content: [{
            type: "text",
            text: `Issue ${issue.identifier} successfully unassigned (was assigned to ${assigneeName})`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error unassigning issue: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool to list issues assigned to a user
  server.tool(
    "listUserAssignments",
    "List all issues assigned to a specific user",
    {
      userId: z.string().describe("ID of the user to list assignments for"),
      includeArchived: z.boolean().optional().describe("Whether to include archived issues (default: false)"),
    },
    async ({ userId, includeArchived = false }) => {
      try {
        const user = await linearClient.getUser(userId);
        const result = await relationshipManager.getIssuesAssignedToUser(userId, includeArchived);
        const issues = result.nodes;

        if (issues.length === 0) {
          return {
            content: [{
              type: "text",
              text: `${user.name} has no assigned issues.`
            }]
          };
        }

        const issueList = await Promise.all(issues.map(async (issue: any) =>
          `- ${issue.identifier}: ${issue.title} (${(await issue.state)?.name || 'Unknown state'})`
        )).then(lines => lines.join('\n'));

        return {
          content: [{
            type: "text",
            text: `${user.name} has ${issues.length} assigned issues:\n\n${issueList}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error listing assignments: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
}
