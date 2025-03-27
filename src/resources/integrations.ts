import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers integration-related resources with the MCP server.
 */
export function registerIntegrationResources(server: McpServer, linearClient: LinearClient) {
  // Resource for listing all integrations
  server.resource(
    "integrations",
    new ResourceTemplate("linear://integrations", { 
      list: async (_extra: RequestHandlerExtra) => {
        const rawClient = linearClient.getRawClient();
        
        // Fetch active integrations using a direct GraphQL query
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.client.request(`
          query Integrations {
            integrations(first: 100) {
              nodes {
                id
                service
              }
            }
          }
        `);
        
        // @ts-ignore - The Linear SDK types may not be up to date
        const integrations = result.integrations.nodes;
        
        return {
          resources: integrations.map((integration: any) => ({
            uri: `linear://integrations/${integration.id}`,
            name: `${integration.service} Integration`,
          }))
        };
      } 
    }),
    {
      description: "List of active Linear integrations",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // Fetch integrations using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query Integrations {
          integrations(first: 100) {
            nodes {
              id
              service
              createdAt
            }
          }
        }
      `);
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const integrations = result.integrations.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: `# Active Linear Integrations\n\n` +
            integrations.map((integration: any) => {
              const createdAt = new Date(integration.createdAt).toLocaleDateString();
              return `- ${integration.service} (Added: ${createdAt})`;
            }).join('\n'),
        }]
      };
    }
  );

  // Resource for a specific integration
  server.resource(
    "integration",
    new ResourceTemplate("linear://integrations/{id}", { list: undefined }),
    {
      description: "Details about a specific Linear integration",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { id } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch integration data using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query IntegrationDetails($id: String!) {
          integration(id: $id) {
            id
            service
            createdAt
            updatedAt
            organizationId
          }
        }
      `, { id });
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const integration = result.integration;
      
      if (!integration) {
        throw new Error(`Integration with ID ${id} not found`);
      }
      
      // Format the integration data for display
      let formattedIntegration = `# ${integration.service} Integration\n\n`;
      formattedIntegration += `Integration ID: ${integration.id}\n`;
      formattedIntegration += `Organization ID: ${integration.organizationId}\n`;
      formattedIntegration += `Added: ${new Date(integration.createdAt).toLocaleString()}\n`;
      
      if (integration.updatedAt) {
        formattedIntegration += `Last Updated: ${new Date(integration.updatedAt).toLocaleString()}\n`;
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: formattedIntegration,
        }]
      };
    }
  );

  // Resource for available integration services
  server.resource(
    "integrationServices",
    new ResourceTemplate("linear://integration-services", { list: undefined }),
    {
      description: "List of available integration services for Linear",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // Fetch integration services using a direct GraphQL query
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.client.request(`
        query IntegrationServices {
          integrationServices {
            nodes {
              id
              name
              description
              apiUrl
              apiUrlAlternative
            }
          }
        }
      `);
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const services = result.integrationServices.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: `# Available Linear Integration Services\n\n` +
            services.map((service: any) => {
              let serviceText = `## ${service.name}\n\n`;
              
              if (service.description) {
                serviceText += `${service.description}\n\n`;
              }
              
              if (service.apiUrl) {
                serviceText += `API URL: ${service.apiUrl}\n`;
              }
              
              if (service.apiUrlAlternative) {
                serviceText += `Alternative API URL: ${service.apiUrlAlternative}\n`;
              }
              
              return serviceText;
            }).join('\n\n'),
        }]
      };
    }
  );
}
