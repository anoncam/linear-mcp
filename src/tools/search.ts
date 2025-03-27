import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";

/**
 * Registers search-related tools with the MCP server.
 */
export function registerSearchTools(server: McpServer, linearClient: LinearClient) {
  // Tool to search across Linear
  server.tool(
    "searchLinear",
    "Search across issues, projects, and users in Linear",
    {
      query: z.string().describe("Search query string"),
      scope: z.enum(["all", "issues", "projects", "users"]).optional().describe("Scope of the search (default: all)"),
      first: z.number().min(1).max(100).optional().describe("Number of results to return (max 100)"),
    },
    async ({ query, scope = "all", first = 20 }) => {
      try {
        const results: string[] = [];
        
        // Search issues if scope is "all" or "issues"
        if (scope === "all" || scope === "issues") {
          try {
            const issueResults = await linearClient.searchIssues(query, { first });
            if (issueResults.nodes.length > 0) {
              results.push(`## Issues (${issueResults.nodes.length} results)`);
              
              const issueList = await Promise.all(issueResults.nodes.map(async issue => 
                `- ${issue.identifier}: ${issue.title} (${(await issue.state)?.name || 'Unknown state'}) - ${issue.url}`
              )).then(lines => lines.join('\n'));
              
              results.push(issueList);
            }
          } catch (error) {
            results.push("Error searching issues: " + (error as Error).message);
          }
        }
        
        // Search projects if scope is "all" or "projects"
        if (scope === "all" || scope === "projects") {
          try {
            // Use the raw client to search projects
            const rawClient = linearClient.getRawClient();
            const projectResults = await rawClient.projects({
              filter: {
                name: { containsIgnoreCase: query }
              },
              first
            });
            
            if (projectResults.nodes.length > 0) {
              results.push(`## Projects (${projectResults.nodes.length} results)`);
              
              const projectList = projectResults.nodes.map(project => 
                `- ${project.name} (${project.state || 'Unknown state'}) - ${project.url || 'No URL'}`
              ).join('\n');
              
              results.push(projectList);
            }
          } catch (error) {
            results.push("Error searching projects: " + (error as Error).message);
          }
        }
        
        // Search users if scope is "all" or "users"
        if (scope === "all" || scope === "users") {
          try {
            // Use the raw client to search users
            const rawClient = linearClient.getRawClient();
            const userResults = await rawClient.users({
              filter: {
                name: { containsIgnoreCase: query }
              },
              first
            });
            
            if (userResults.nodes.length > 0) {
              results.push(`## Users (${userResults.nodes.length} results)`);
              
              const userList = userResults.nodes.map(user => 
                `- ${user.name} (${user.displayName || user.email || 'No display name'}) - ${user.url || 'No URL'}`
              ).join('\n');
              
              results.push(userList);
            }
          } catch (error) {
            results.push("Error searching users: " + (error as Error).message);
          }
        }
        
        if (results.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No results found for "${query}" in ${scope} scope.` 
            }]
          };
        }
        
        return {
          content: [{ 
            type: "text", 
            text: results.join('\n\n')
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

  // Tool to search for issues by label
  server.tool(
    "searchIssuesByLabel",
    "Search for issues with specific labels in Linear",
    {
      labelName: z.string().describe("Name of the label to search for"),
      teamId: z.string().optional().describe("Optional team ID to filter by"),
      first: z.number().min(1).max(100).optional().describe("Number of results to return (max 100)"),
    },
    async ({ labelName, teamId, first = 20 }) => {
      try {
        // Use the raw client for more complex queries
        const rawClient = linearClient.getRawClient();
        
        // Build the filter
        const filter: any = {
          labels: { name: { containsIgnoreCase: labelName } }
        };
        
        // Add team filter if provided
        if (teamId) {
          filter.team = { id: { eq: teamId } };
        }
        
        const result = await rawClient.issues({
          filter,
          first
        });
        
        const issues = result.nodes;
        
        if (issues.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No issues found with label containing "${labelName}"${teamId ? ' in the specified team' : ''}.` 
            }]
          };
        }
        
        const issueList = await Promise.all(issues.map(async issue => 
          `- ${issue.identifier}: ${issue.title} (${(await issue.state)?.name || 'Unknown state'}) - ${issue.url}`
        )).then(lines => lines.join('\n'));
        
        return {
          content: [{ 
            type: "text", 
            text: `Found ${issues.length} issues with label containing "${labelName}":\n\n${issueList}` 
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
