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

  // Tool to retrieve resource UUIDs
  server.tool(
    "getResourceUUIDs",
    "Retrieve UUIDs of Linear resources (teams, issues, projects, users, etc.)",
    {
      resourceType: z.enum(["teams", "issues", "projects", "users", "labels", "states", "cycles", "documents", "initiatives", "roadmaps", "milestones"]).describe("Type of resource to retrieve UUIDs for"),
      nameFilter: z.string().optional().describe("Optional filter to search for resources by name"),
      teamId: z.string().optional().describe("Optional team ID to filter by (for team-specific resources)"),
      first: z.number().min(1).max(100).optional().describe("Number of results to return (max 100)"),
    },
    async ({ resourceType, nameFilter, teamId, first = 100 }) => {
      try {
        let resources: any[] = [];
        let resourceList = "";

        switch (resourceType) {
          case "teams":
            const teamsResult = await linearClient.listTeams({ first });
            resources = teamsResult.nodes;

            // Filter teams by name if a filter is provided
            if (nameFilter) {
              resources = resources.filter(team =>
                team.name.toLowerCase().includes(nameFilter.toLowerCase())
              );
            }

            resourceList = resources.map(team =>
              `- ${team.name} (${team.key}): ${team.id}`
            ).join('\n');
            break;

          case "issues":
            const options: any = { first };
            if (teamId) {
              options.teamIds = [teamId];
            }
            const issuesResult = await linearClient.listIssues(options);
            resources = issuesResult.nodes;

            // Filter issues by title if a filter is provided
            if (nameFilter) {
              resources = resources.filter(issue =>
                issue.title.toLowerCase().includes(nameFilter.toLowerCase())
              );
            }

            resourceList = await Promise.all(resources.map(async issue =>
              `- ${issue.identifier}: ${issue.title} (${(await issue.state)?.name || 'Unknown state'}): ${issue.id}`
            )).then(lines => lines.join('\n'));
            break;

          case "projects":
            const projectOptions: any = { first };
            if (teamId) {
              projectOptions.teamIds = [teamId];
            }
            const projectsResult = await linearClient.listProjects(projectOptions);
            resources = projectsResult.nodes;

            // Filter projects by name if a filter is provided
            if (nameFilter) {
              resources = resources.filter(project =>
                project.name.toLowerCase().includes(nameFilter.toLowerCase())
              );
            }

            resourceList = resources.map(project =>
              `- ${project.name}: ${project.id}`
            ).join('\n');
            break;

          case "users":
            const usersResult = await linearClient.listUsers({ first });
            resources = usersResult.nodes;

            // Filter users by name if a filter is provided
            if (nameFilter) {
              resources = resources.filter(user =>
                user.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                (user.displayName && user.displayName.toLowerCase().includes(nameFilter.toLowerCase()))
              );
            }

            resourceList = resources.map(user =>
              `- ${user.name} (${user.displayName || user.email || 'No display name'}): ${user.id}`
            ).join('\n');
            break;

          case "labels":
            const labelOptions: any = { first };
            if (teamId) {
              labelOptions.teamId = teamId;
            }
            const labelsResult = await linearClient.listLabels(labelOptions);
            resources = labelsResult.nodes;

            // Filter labels by name if a filter is provided
            if (nameFilter) {
              resources = resources.filter(label =>
                label.name.toLowerCase().includes(nameFilter.toLowerCase())
              );
            }

            resourceList = resources.map(label =>
              `- ${label.name}${label.description ? ` - ${label.description}` : ''}: ${label.id}`
            ).join('\n');
            break;

          case "states":
            if (!teamId) {
              return {
                content: [{
                  type: "text",
                  text: "Error: teamId is required for retrieving workflow states"
                }],
                isError: true
              };
            }

            const statesResult = await linearClient.listWorkflowStates(teamId, { first });
            resources = statesResult.nodes;

            // Filter states by name if a filter is provided
            if (nameFilter) {
              resources = resources.filter(state =>
                state.name.toLowerCase().includes(nameFilter.toLowerCase())
              );
            }

            resourceList = resources.map(state =>
              `- ${state.name} (${state.type}): ${state.id}`
            ).join('\n');
            break;

          case "cycles":
            if (!teamId) {
              return {
                content: [{
                  type: "text",
                  text: "Error: teamId is required for retrieving cycles"
                }],
                isError: true
              };
            }

            const cyclesResult = await linearClient.listCycles(teamId, { first });
            resources = cyclesResult.nodes;

            // Filter cycles by name if a filter is provided
            if (nameFilter) {
              resources = resources.filter(cycle =>
                (cycle.name && cycle.name.toLowerCase().includes(nameFilter.toLowerCase())) ||
                cycle.number.toString().includes(nameFilter)
              );
            }

            resourceList = resources.map(cycle => {
              const startDate = cycle.startsAt ? new Date(cycle.startsAt).toLocaleDateString() : 'Unknown';
              const endDate = cycle.endsAt ? new Date(cycle.endsAt).toLocaleDateString() : 'Unknown';

              return `- ${cycle.number}: ${startDate} to ${endDate} - ${cycle.name || 'Unnamed cycle'}: ${cycle.id}`;
            }).join('\n');
            break;

          // For other resource types, we'll need to implement specific fetching logic
          // These would require additional methods in the LinearClient class
          case "documents":
          case "initiatives":
          case "roadmaps":
          case "milestones":
            return {
              content: [{
                type: "text",
                text: `Retrieving UUIDs for ${resourceType} is not yet implemented. Please use the appropriate resource endpoints to access these resources.`
              }]
            };

          default:
            return {
              content: [{
                type: "text",
                text: `Unknown resource type: ${resourceType}`
              }],
              isError: true
            };
        }

        if (resources.length === 0) {
          return {
            content: [{
              type: "text",
              text: nameFilter
                ? `No ${resourceType} found matching "${nameFilter}"${teamId ? ' in the specified team' : ''}.`
                : `No ${resourceType} found${teamId ? ' in the specified team' : ' in your Linear organization'}.`
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: `## ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} UUIDs\n\n${resourceList}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error retrieving ${resourceType} UUIDs: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool to retrieve team UUIDs (kept for backward compatibility)
  server.tool(
    "getTeamUUIDs",
    "Retrieve UUIDs of Linear teams",
    {
      nameFilter: z.string().optional().describe("Optional filter to search for teams by name"),
      first: z.number().min(1).max(100).optional().describe("Number of results to return (max 100)"),
    },
    async ({ nameFilter, first = 100 }) => {
      try {
        // Get all teams
        const teamsResult = await linearClient.listTeams({ first });

        // Filter teams by name if a filter is provided
        let teams = teamsResult.nodes;
        if (nameFilter) {
          teams = teams.filter(team =>
            team.name.toLowerCase().includes(nameFilter.toLowerCase())
          );
        }

        if (teams.length === 0) {
          return {
            content: [{
              type: "text",
              text: nameFilter
                ? `No teams found matching "${nameFilter}".`
                : "No teams found in your Linear organization."
            }]
          };
        }

        // Format the results with team name, key, and UUID
        const teamList = teams.map(team =>
          `- ${team.name} (${team.key}): ${team.id}`
        ).join('\n');

        return {
          content: [{
            type: "text",
            text: `## Team UUIDs\n\n${teamList}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error retrieving team UUIDs: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
}
