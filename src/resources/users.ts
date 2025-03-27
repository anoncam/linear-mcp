import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { formatUserForDisplay } from "../linear/types.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers user-related resources with the MCP server.
 */
export function registerUserResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific user
  server.resource(
    "user",
    new ResourceTemplate("linear://users/{id}", { list: undefined }),
    {
      description: "A Linear user with all their details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const id = variables.id as string;
      const user = await linearClient.getUser(id);
      
      return {
        contents: [{
          uri: uri.href,
          text: await formatUserForDisplay(user),
        }]
      };
    }
  );

  // Resource for listing all users
  server.resource(
    "users",
    new ResourceTemplate("linear://users", { 
      list: async (_extra: RequestHandlerExtra) => {
        const result = await linearClient.listUsers({ first: 100 });
        const users = result.nodes;
        
        return {
          resources: users.map(user => ({
            uri: `linear://users/${user.id}`,
            name: user.name,
            description: user.email || undefined,
          }))
        };
      } 
    }),
    {
      description: "List of Linear users",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const users = await linearClient.listUsers({ first: 100 });
      
      return {
        contents: [{
          uri: uri.href,
          text: users.nodes.map(user => 
            `- ${user.name} (${user.email})`
          ).join('\n'),
        }]
      };
    }
  );

  // Resource for team members
  server.resource(
    "teamMembers",
    new ResourceTemplate("linear://teams/{teamId}/members", { list: undefined }),
    {
      description: "Members of a specific team",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const teamId = variables.teamId as string;
      
      // Fetch team
      const team = await linearClient.getTeam(teamId);
      const membersQuery = await team.members();
      const members = membersQuery.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: members.map(member => 
            `- ${member.name} (${member.email || 'No email'})`
          ).join('\n'),
        }]
      };
    }
  );
}
