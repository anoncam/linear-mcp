import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers milestone-related resources with the MCP server.
 */
export function registerMilestoneResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific milestone
  server.resource(
    "milestone",
    new ResourceTemplate("linear://milestones/{id}", { list: undefined }),
    {
      description: "A Linear milestone with all its details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { id } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch milestone data using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query MilestoneDetails($id: String!) {
          milestone(id: $id) {
            id
            name
            description
            createdAt
            updatedAt
            targetDate
            sortOrder
            projects {
              nodes {
                id
                name
              }
            }
          }
        }
      `, { id });
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const milestone = result.milestone;
      
      if (!milestone) {
        throw new Error(`Milestone with ID ${id} not found`);
      }
      
      // Format the milestone data for display
      let formattedMilestone = `# ${milestone.name}\n\n`;
      
      if (milestone.description) {
        formattedMilestone += `${milestone.description}\n\n`;
      }
      
      if (milestone.targetDate) {
        formattedMilestone += `Target Date: ${new Date(milestone.targetDate).toLocaleDateString()}\n\n`;
      }
      
      if (milestone.projects?.nodes?.length > 0) {
        formattedMilestone += `## Projects\n\n`;
        
        milestone.projects.nodes.forEach((project: any) => {
          formattedMilestone += `- ${project.name}\n`;
        });
        
        formattedMilestone += `\n`;
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: formattedMilestone,
        }]
      };
    }
  );

  // Resource for listing all milestones
  server.resource(
    "milestones",
    new ResourceTemplate("linear://milestones", { 
      list: async (_extra: RequestHandlerExtra) => {
        const rawClient = linearClient.getRawClient();
        
        // Fetch milestones using a direct GraphQL query
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.client.request(`
          query Milestones {
            milestones(first: 100) {
              nodes {
                id
                name
                description
              }
            }
          }
        `);
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const milestones = result.milestones.nodes;
        
        return {
          resources: milestones.map((milestone: any) => ({
            uri: `linear://milestones/${milestone.id}`,
            name: milestone.name,
            description: milestone.description?.substring(0, 100) || undefined,
          }))
        };
      } 
    }),
    {
      description: "List of Linear milestones",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // Fetch milestones using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query Milestones {
          milestones(first: 100) {
            nodes {
              id
              name
              targetDate
            }
          }
        }
      `);
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const milestones = result.milestones.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: milestones.map((milestone: any) => {
            const targetDate = milestone.targetDate 
              ? `(Target: ${new Date(milestone.targetDate).toLocaleDateString()})` 
              : '';
            
            return `- ${milestone.name} ${targetDate}`;
          }).join('\n'),
        }]
      };
    }
  );

  // Resource for milestone projects
  server.resource(
    "milestoneProjects",
    new ResourceTemplate("linear://milestones/{milestoneId}/projects", { list: undefined }),
    {
      description: "Projects for a specific milestone",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { milestoneId } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch milestone projects using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query MilestoneProjects($milestoneId: String!) {
          milestone(id: $milestoneId) {
            name
            projects {
              nodes {
                id
                name
                state
                startDate
                targetDate
              }
            }
          }
        }
      `, { milestoneId });
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const milestone = result.milestone;
      
      if (!milestone) {
        throw new Error(`Milestone with ID ${milestoneId} not found`);
      }
      
      const projects = milestone.projects.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: `# Projects for ${milestone.name}\n\n` + 
            projects.map((project: any) => {
              const dates = [];
              if (project.startDate) {
                dates.push(`Start: ${new Date(project.startDate).toLocaleDateString()}`);
              }
              if (project.targetDate) {
                dates.push(`Target: ${new Date(project.targetDate).toLocaleDateString()}`);
              }
              
              const dateStr = dates.length > 0 ? `(${dates.join(', ')})` : '';
              
              return `- ${project.name} - ${project.state || 'No state'} ${dateStr}`;
            }).join('\n'),
        }]
      };
    }
  );
}
