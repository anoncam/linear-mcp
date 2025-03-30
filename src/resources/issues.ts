import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { formatIssueForDisplay } from "../linear/types.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers issue-related resources with the MCP server.
 */
export function registerIssueResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific issue
  server.resource(
    "issue",
    new ResourceTemplate("linear://issues/{id}", { list: undefined }),
    {
      description: "A Linear issue with all its details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const id = variables.id as string;
      const issue = await linearClient.getIssue(id);

      return {
        contents: [{
          uri: uri.href,
          text: await formatIssueForDisplay(issue),
        }]
      };
    }
  );

  // Resource for listing all issues (optionally filtered)
  server.resource(
    "issues",
    new ResourceTemplate("linear://issues", {
      list: async (_extra: RequestHandlerExtra) => {
        const result = await linearClient.listIssues({ first: 100 });
        const issues = result.nodes;

        return {
          resources: issues.map(issue => ({
            uri: `linear://issues/${issue.id}`,
            name: `${issue.identifier}: ${issue.title}`,
            description: issue.description?.substring(0, 100) || undefined,
          }))
        };
      }
    }),
    {
      description: "List of Linear issues",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const issues = await linearClient.listIssues({ first: 100 });

      return {
        contents: [{
          uri: uri.href,
          text: await Promise.all(issues.nodes.map(async issue =>
            `- ${issue.identifier}: ${issue.title} (${(await issue.state)?.name || 'Unknown state'})`
          )).then(lines => lines.join('\n')),
        }]
      };
    }
  );

  // Resource for issues filtered by team
  server.resource(
    "teamIssues",
    new ResourceTemplate("linear://teams/{teamId}/issues", { list: undefined }),
    {
      description: "Linear issues for a specific team",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const teamId = variables.teamId as string;
      const issues = await linearClient.listIssues({
        teamIds: [teamId],
        first: 100
      });

      return {
        contents: [{
          uri: uri.href,
          text: await Promise.all(issues.nodes.map(async issue =>
            `- ${issue.identifier}: ${issue.title} (${(await issue.state)?.name || 'Unknown state'})`
          )).then(lines => lines.join('\n')),
        }]
      };
    }
  );

  // Resource for issues filtered by state
  server.resource(
    "stateIssues",
    new ResourceTemplate("linear://states/{stateId}/issues", { list: undefined }),
    {
      description: "Linear issues in a specific state",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const stateId = variables.stateId as string;
      const issues = await linearClient.listIssues({
        states: [stateId],
        first: 100
      });

      return {
        contents: [{
          uri: uri.href,
          text: await Promise.all(issues.nodes.map(async issue =>
            `- ${issue.identifier}: ${issue.title} (${(await issue.state)?.name || 'Unknown state'})`
          )).then(lines => lines.join('\n')),
        }]
      };
    }
  );

  // Resource for issues assigned to a user
  server.resource(
    "userIssues",
    new ResourceTemplate("linear://users/{userId}/issues", { list: undefined }),
    {
      description: "Linear issues assigned to a specific user",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const userId = variables.userId as string;

      // Use the dedicated method for fetching user assignments
      const result = await linearClient.getIssuesAssignedToUser(userId, { first: 100 });
      const issues = result.nodes;

      return {
        contents: [{
          uri: uri.href,
          text: await Promise.all(issues.map(async (issue: any) =>
            `- ${issue.identifier}: ${issue.title} (${(await issue.state)?.name || 'Unknown state'})${(await issue.assignee) ? ` - Assigned to: ${(await issue.assignee)?.name || 'Unknown'}` : ''}`
          )).then(lines => lines.join('\n')),
        }]
      };
    }
  );
}
