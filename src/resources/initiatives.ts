import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers initiative-related resources with the MCP server.
 */
export function registerInitiativeResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific initiative
  server.resource(
    "initiative",
    new ResourceTemplate("linear://initiatives/{id}", { list: undefined }),
    {
      description: "A Linear initiative with all its details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { id } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch initiative data using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query InitiativeDetails($id: String!) {
          initiative(id: $id) {
            id
            name
            description
            createdAt
            updatedAt
            startDate
            targetDate
            state
            sortOrder
            initiativeProjects {
              nodes {
                id
                project {
                  id
                  name
                  state
                }
              }
            }
          }
        }
      `, { id });
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const initiative = result.initiative;
      
      if (!initiative) {
        throw new Error(`Initiative with ID ${id} not found`);
      }
      
      // Format the initiative data for display
      let formattedInitiative = `# ${initiative.name}\n\n`;
      
      if (initiative.description) {
        formattedInitiative += `${initiative.description}\n\n`;
      }
      
      formattedInitiative += `State: ${initiative.state || 'Not started'}\n`;
      
      if (initiative.startDate) {
        formattedInitiative += `Start Date: ${new Date(initiative.startDate).toLocaleDateString()}\n`;
      }
      
      if (initiative.targetDate) {
        formattedInitiative += `Target Date: ${new Date(initiative.targetDate).toLocaleDateString()}\n\n`;
      }
      
      // Add related projects
      if (initiative.initiativeProjects?.nodes?.length > 0) {
        formattedInitiative += `## Related Projects\n\n`;
        
        initiative.initiativeProjects.nodes.forEach((initiativeProject: any) => {
          const project = initiativeProject.project;
          formattedInitiative += `- ${project.name} (${project.state || 'No state'})\n`;
        });
        
        formattedInitiative += `\n`;
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: formattedInitiative,
        }]
      };
    }
  );

  // Resource for listing all initiatives
  server.resource(
    "initiatives",
    new ResourceTemplate("linear://initiatives", { 
      list: async (_extra: RequestHandlerExtra) => {
        const rawClient = linearClient.getRawClient();
        
        // Fetch initiatives using a direct GraphQL query
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.client.request(`
          query Initiatives {
            initiatives(first: 100) {
              nodes {
                id
                name
                description
              }
            }
          }
        `);
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const initiatives = result.initiatives.nodes;
        
        return {
          resources: initiatives.map((initiative: any) => ({
            uri: `linear://initiatives/${initiative.id}`,
            name: initiative.name,
            description: initiative.description?.substring(0, 100) || undefined,
          }))
        };
      } 
    }),
    {
      description: "List of Linear initiatives",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // Fetch initiatives using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query Initiatives {
          initiatives(first: 100) {
            nodes {
              id
              name
              state
              targetDate
            }
          }
        }
      `);
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const initiatives = result.initiatives.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: initiatives.map((initiative: any) => {
            const targetDate = initiative.targetDate 
              ? `(Target: ${new Date(initiative.targetDate).toLocaleDateString()})` 
              : '';
            
            return `- ${initiative.name} - ${initiative.state || 'No state'} ${targetDate}`;
          }).join('\n'),
        }]
      };
    }
  );

  // Resource for initiative projects
  server.resource(
    "initiativeProjects",
    new ResourceTemplate("linear://initiatives/{initiativeId}/projects", { list: undefined }),
    {
      description: "Projects for a specific initiative",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { initiativeId } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch initiative projects using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query InitiativeProjects($initiativeId: String!) {
          initiative(id: $initiativeId) {
            name
            initiativeProjects {
              nodes {
                id
                project {
                  id
                  name
                  description
                  state
                  targetDate
                  teams {
                    nodes {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `, { initiativeId });
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const initiative = result.initiative;
      
      if (!initiative) {
        throw new Error(`Initiative with ID ${initiativeId} not found`);
      }
      
      const initiativeProjects = initiative.initiativeProjects.nodes;
      
      // Format the projects in a detailed way
      let projectsList = `# Projects for Initiative: ${initiative.name}\n\n`;
      
      if (initiativeProjects.length === 0) {
        projectsList += "No projects associated with this initiative.";
      } else {
        initiativeProjects.forEach((initiativeProject: any) => {
          const project = initiativeProject.project;
          
          projectsList += `## ${project.name}\n\n`;
          
          if (project.description) {
            projectsList += `${project.description}\n\n`;
          }
          
          projectsList += `State: ${project.state || 'No state'}\n`;
          
          if (project.targetDate) {
            projectsList += `Target Date: ${new Date(project.targetDate).toLocaleDateString()}\n`;
          }
          
          if (project.teams?.nodes?.length > 0) {
            projectsList += `Teams: ${project.teams.nodes.map((team: any) => team.name).join(', ')}\n`;
          }
          
          projectsList += `\nResource: linear://projects/${project.id}\n\n`;
        });
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: projectsList,
        }]
      };
    }
  );
  
  // Update our project resource to show initiative relationship
  server.resource(
    "projectInitiative",
    new ResourceTemplate("linear://projects/{projectId}/initiative", { list: undefined }),
    {
      description: "Initiative associated with a specific project",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { projectId } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch project initiative using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query ProjectInitiative($projectId: String!) {
          project(id: $projectId) {
            name
            initiativeProject {
              initiative {
                id
                name
                description
                state
                targetDate
              }
            }
          }
        }
      `, { projectId });
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const project = result.project;
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      const initiativeProject = project.initiativeProject;
      
      if (!initiativeProject?.initiative) {
        return {
          contents: [{
            uri: uri.href,
            text: `# Initiative for Project: ${project.name}\n\nThis project is not associated with any initiative.`,
          }]
        };
      }
      
      const initiative = initiativeProject.initiative;
      
      // Format the initiative info
      let initiativeInfo = `# Initiative for Project: ${project.name}\n\n`;
      initiativeInfo += `## ${initiative.name}\n\n`;
      
      if (initiative.description) {
        initiativeInfo += `${initiative.description}\n\n`;
      }
      
      initiativeInfo += `State: ${initiative.state || 'No state'}\n`;
      
      if (initiative.targetDate) {
        initiativeInfo += `Target Date: ${new Date(initiative.targetDate).toLocaleDateString()}\n`;
      }
      
      initiativeInfo += `\nResource: linear://initiatives/${initiative.id}`;
      
      return {
        contents: [{
          uri: uri.href,
          text: initiativeInfo,
        }]
      };
    }
  );
}
