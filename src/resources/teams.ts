import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { formatTeamForDisplay } from "../linear/types.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers team-related resources with the MCP server.
 */
export function registerTeamResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific team
  server.resource(
    "team",
    new ResourceTemplate("linear://teams/{id}", { list: undefined }),
    {
      description: "A Linear team with all its details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const id = variables.id as string;
      const team = await linearClient.getTeam(id);
      
      return {
        contents: [{
          uri: uri.href,
          text: await formatTeamForDisplay(team),
        }]
      };
    }
  );

  // Resource for listing all teams
  server.resource(
    "teams",
    new ResourceTemplate("linear://teams", { 
      list: async (_extra: RequestHandlerExtra) => {
        const result = await linearClient.listTeams({ first: 100 });
        const teams = result.nodes;
        
        return {
          resources: teams.map(team => ({
            uri: `linear://teams/${team.id}`,
            name: team.name,
            description: team.description || undefined,
          }))
        };
      } 
    }),
    {
      description: "List of Linear teams",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const teams = await linearClient.listTeams({ first: 100 });
      
      return {
        contents: [{
          uri: uri.href,
          text: teams.nodes.map(team => 
            `- ${team.name} (${team.key})`
          ).join('\n'),
        }]
      };
    }
  );

  // Resource for team states (workflow states)
  server.resource(
    "teamStates",
    new ResourceTemplate("linear://teams/{teamId}/states", { list: undefined }),
    {
      description: "Workflow states for a specific team",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const teamId = variables.teamId as string;
      const states = await linearClient.listWorkflowStates(teamId, { first: 100 });
      
      return {
        contents: [{
          uri: uri.href,
          text: states.nodes.map(state => 
            `- ${state.name} (${state.type})`
          ).join('\n'),
        }]
      };
    }
  );

  // Resource for team labels
  server.resource(
    "teamLabels",
    new ResourceTemplate("linear://teams/{teamId}/labels", { list: undefined }),
    {
      description: "Labels for a specific team",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const teamId = variables.teamId as string;
      const labels = await linearClient.listLabels({ teamId, first: 100 });
      
      return {
        contents: [{
          uri: uri.href,
          text: labels.nodes.map(label => 
            `- ${label.name}${label.description ? ` - ${label.description}` : ''}`
          ).join('\n'),
        }]
      };
    }
  );

  // Resource for team cycles
  server.resource(
    "teamCycles",
    new ResourceTemplate("linear://teams/{teamId}/cycles", { list: undefined }),
    {
      description: "Cycles for a specific team",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const teamId = variables.teamId as string;
      const cycles = await linearClient.listCycles(teamId, { first: 100 });
      
      return {
        contents: [{
          uri: uri.href,
          text: cycles.nodes.map(cycle => {
            const startDate = cycle.startsAt ? new Date(cycle.startsAt).toLocaleDateString() : 'Unknown';
            const endDate = cycle.endsAt ? new Date(cycle.endsAt).toLocaleDateString() : 'Unknown';
            
            return `- ${cycle.number}: ${startDate} to ${endDate} - ${cycle.name || 'Unnamed cycle'}`;
          }).join('\n'),
        }]
      };
    }
  );
}
