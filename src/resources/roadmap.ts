import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers roadmap-related resources with the MCP server.
 */
export function registerRoadmapResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific roadmap
  server.resource(
    "roadmap",
    new ResourceTemplate("linear://roadmaps/{id}", { list: undefined }),
    {
      description: "A Linear roadmap with all its details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { id } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch roadmap data using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query RoadmapDetails($id: String!) {
          roadmap(id: $id) {
            id
            name
            description
            createdAt
            updatedAt
            startDate
            targetDate
            milestones {
              nodes {
                id
                name
                description
                targetDate
              }
            }
          }
        }
      `, { id });
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const roadmap = result.roadmap;
      
      if (!roadmap) {
        throw new Error(`Roadmap with ID ${id} not found`);
      }
      
      // Format the roadmap data for display
      let formattedRoadmap = `# ${roadmap.name}\n\n`;
      
      if (roadmap.description) {
        formattedRoadmap += `${roadmap.description}\n\n`;
      }
      
      if (roadmap.startDate) {
        formattedRoadmap += `Start Date: ${new Date(roadmap.startDate).toLocaleDateString()}\n`;
      }
      
      if (roadmap.targetDate) {
        formattedRoadmap += `Target Date: ${new Date(roadmap.targetDate).toLocaleDateString()}\n\n`;
      }
      
      if (roadmap.milestones?.nodes?.length > 0) {
        formattedRoadmap += `## Milestones\n\n`;
        
        roadmap.milestones.nodes.forEach((milestone: any) => {
          formattedRoadmap += `### ${milestone.name}\n`;
          
          if (milestone.description) {
            formattedRoadmap += `${milestone.description}\n`;
          }
          
          if (milestone.targetDate) {
            formattedRoadmap += `Target Date: ${new Date(milestone.targetDate).toLocaleDateString()}\n`;
          }
          
          formattedRoadmap += `\n`;
        });
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: formattedRoadmap,
        }]
      };
    }
  );

  // Resource for listing all roadmaps
  server.resource(
    "roadmaps",
    new ResourceTemplate("linear://roadmaps", { 
      list: async (_extra: RequestHandlerExtra) => {
        const rawClient = linearClient.getRawClient();
        
        // Fetch roadmaps using a direct GraphQL query
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.client.request(`
          query Roadmaps {
            roadmaps(first: 100) {
              nodes {
                id
                name
                description
              }
            }
          }
        `);
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const roadmaps = result.roadmaps.nodes;
        
        return {
          resources: roadmaps.map((roadmap: any) => ({
            uri: `linear://roadmaps/${roadmap.id}`,
            name: roadmap.name,
            description: roadmap.description?.substring(0, 100) || undefined,
          }))
        };
      } 
    }),
    {
      description: "List of Linear roadmaps",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // Fetch roadmaps using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query Roadmaps {
          roadmaps(first: 100) {
            nodes {
              id
              name
              targetDate
            }
          }
        }
      `);
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const roadmaps = result.roadmaps.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: roadmaps.map((roadmap: any) => {
            const targetDate = roadmap.targetDate 
              ? `(Target: ${new Date(roadmap.targetDate).toLocaleDateString()})` 
              : '';
            
            return `- ${roadmap.name} ${targetDate}`;
          }).join('\n'),
        }]
      };
    }
  );
}
