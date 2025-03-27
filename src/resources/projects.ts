import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { formatProjectForDisplay } from "../linear/types.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers project-related resources with the MCP server.
 */
export function registerProjectResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific project
  server.resource(
    "project",
    new ResourceTemplate("linear://projects/{id}", { list: undefined }),
    {
      description: "A Linear project with all its details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const id = variables.id as string;
      const project = await linearClient.getProject(id);
      
      return {
        contents: [{
          uri: uri.href,
          text: await formatProjectForDisplay(project),
        }]
      };
    }
  );

  // Resource for listing all projects
  server.resource(
    "projects",
    new ResourceTemplate("linear://projects", { 
      list: async (_extra: RequestHandlerExtra) => {
        const result = await linearClient.listProjects({ first: 100 });
        const projects = result.nodes;
        
        return {
          resources: projects.map(project => ({
            uri: `linear://projects/${project.id}`,
            name: project.name,
            description: project.description || undefined,
          }))
        };
      } 
    }),
    {
      description: "List of Linear projects",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const projects = await linearClient.listProjects({ first: 100 });
      
      return {
        contents: [{
          uri: uri.href,
          text: projects.nodes.map(project => 
            `- ${project.name} (${project.state || 'Unknown state'})`
          ).join('\n'),
        }]
      };
    }
  );

  // Resource for projects filtered by team
  server.resource(
    "teamProjects",
    new ResourceTemplate("linear://teams/{teamId}/projects", { list: undefined }),
    {
      description: "Linear projects for a specific team",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const teamId = variables.teamId as string;
      const projects = await linearClient.listProjects({ 
        teamIds: [teamId],
        first: 100 
      });
      
      return {
        contents: [{
          uri: uri.href,
          text: projects.nodes.map(project => 
            `- ${project.name} (${project.state || 'Unknown state'})`
          ).join('\n'),
        }]
      };
    }
  );

  // Resource for project issues
  server.resource(
    "projectIssues",
    new ResourceTemplate("linear://projects/{projectId}/issues", { list: undefined }),
    {
      description: "Issues in a specific project",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const projectId = variables.projectId as string;
      
      // Use the raw client to query issues by project
      const rawClient = linearClient.getRawClient();
      const result = await rawClient.issues({
        filter: {
          project: { id: { eq: projectId } }
        },
        first: 100
      });
      
      const issues = result.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: await Promise.all(issues.map(async issue => {
            const state = await issue.state;
            return `- ${issue.identifier}: ${issue.title} (${state?.name || 'Unknown state'})`;
          })).then(lines => lines.join('\n')),
        }]
      };
    }
  );
}
