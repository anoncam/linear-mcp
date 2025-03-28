import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers cycle-related resources with the MCP server.
 */
export function registerCycleResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific cycle
  server.resource(
    "cycle",
    new ResourceTemplate("linear://cycles/{id}", { list: undefined }),
    {
      description: "A Linear cycle with all its details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const id = variables.id as string;
      const cycle = await linearClient.getCycle(id);
      
      return {
        contents: [{
          uri: uri.href,
          text: await formatCycleForDisplay(cycle),
        }]
      };
    }
  );

  // Resource for listing all cycles
  server.resource(
    "cycles",
    new ResourceTemplate("linear://cycles", { 
      list: async (_extra: RequestHandlerExtra) => {
        // Get all teams
        const teams = await linearClient.listTeams();
        
        // Get cycles from all teams
        const cyclesPromises = teams.nodes.map(async team => {
          const cycles = await linearClient.listCycles(team.id);
          return cycles.nodes.map(cycle => ({
            uri: `linear://cycles/${cycle.id}`,
            name: cycle.name || `Cycle ${cycle.id}`, // Ensure name is never undefined
            description: `${team.name} cycle: ${formatCycleDates(cycle)}`,
          }));
        });
        
        const allCycles = (await Promise.all(cyclesPromises)).flat();
        
        return {
          resources: allCycles
        };
      } 
    }),
    {
      description: "List of Linear cycles across all teams",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      // Get all teams
      const teams = await linearClient.listTeams();
      
      // Get cycles from all teams
      const cyclesPromises = teams.nodes.map(async team => {
        const cycles = await linearClient.listCycles(team.id);
        return cycles.nodes.map(cycle => 
          `- ${cycle.name} (${team.name}, ${formatCycleDates(cycle)})`
        );
      });
      
      const allCycles = (await Promise.all(cyclesPromises)).flat();
      
      return {
        contents: [{
          uri: uri.href,
          text: allCycles.join('\n'),
        }]
      };
    }
  );

  // Note: "teamCycles" resource is already defined in teams.ts

  // Resource for cycle issues
  server.resource(
    "cycleIssues",
    new ResourceTemplate("linear://cycles/{cycleId}/issues", { list: undefined }),
    {
      description: "Issues in a specific cycle",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const cycleId = variables.cycleId as string;
      const cycle = await linearClient.getCycle(cycleId);
      const issues = await cycle.issues();
      
      return {
        contents: [{
          uri: uri.href,
          text: await Promise.all(issues.nodes.map(async issue => {
            const state = await issue.state;
            return `- ${issue.identifier}: ${issue.title} (${state?.name || 'Unknown state'})`;
          })).then(lines => lines.join('\n')),
        }]
      };
    }
  );

  // Resource for active cycles
  server.resource(
    "activeCycles",
    new ResourceTemplate("linear://cycles/active", { list: undefined }),
    {
      description: "Currently active cycles across all teams",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      // Get all teams
      const teams = await linearClient.listTeams();
      
      const now = new Date();
      
      // Get active cycles from all teams
      const activeCyclesPromises = teams.nodes.map(async team => {
        const cycles = await linearClient.listCycles(team.id);
        return cycles.nodes
          .filter(cycle => {
            const startDate = new Date(cycle.startsAt);
            const endDate = new Date(cycle.endsAt);
            return startDate <= now && endDate >= now;
          })
          .map(cycle => 
            `- ${cycle.name} (${team.name}, ${formatCycleDates(cycle)})`
          );
      });
      
      const activeCycles = (await Promise.all(activeCyclesPromises)).flat();
      
      return {
        contents: [{
          uri: uri.href,
          text: activeCycles.length > 0 
            ? activeCycles.join('\n')
            : "No active cycles found.",
        }]
      };
    }
  );
}

/**
 * Format cycle dates for display
 */
function formatCycleDates(cycle: any): string {
  const startDate = new Date(cycle.startsAt).toLocaleDateString();
  const endDate = new Date(cycle.endsAt).toLocaleDateString();
  return `${startDate} to ${endDate}`;
}

/**
 * Format a cycle for display
 */
async function formatCycleForDisplay(cycle: any): Promise<string> {
  const team = await cycle.team;
  const issues = await cycle.issues();
  
  // Calculate completion metrics
  const totalIssues = issues.nodes.length;
  const completedIssues = issues.nodes.filter((issue: any) => issue.completedAt).length;
  const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
  
  let result = `# ${cycle.name}\n\n`;
  result += `Team: ${team.name}\n`;
  result += `Duration: ${new Date(cycle.startsAt).toLocaleDateString()} to ${new Date(cycle.endsAt).toLocaleDateString()}\n`;
  result += `Status: ${getCycleStatus(cycle)}\n`;
  result += `Completion: ${completionRate}% (${completedIssues}/${totalIssues} issues)\n\n`;
  
  if (cycle.description) {
    result += `## Description\n\n${cycle.description}\n\n`;
  }
  
  return result;
}

/**
 * Get the status of a cycle based on dates
 */
function getCycleStatus(cycle: any): string {
  const now = new Date();
  const startDate = new Date(cycle.startsAt);
  const endDate = new Date(cycle.endsAt);
  
  if (now < startDate) {
    return "Upcoming";
  } else if (now > endDate) {
    return "Completed";
  } else {
    return "Active";
  }
}
