import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Registers document-related resources with the MCP server.
 */
export function registerDocumentResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific document
  server.resource(
    "document",
    new ResourceTemplate("linear://documents/{id}", { list: undefined }),
    {
      description: "A Linear document with all its contents",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { id } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch document data using a direct GraphQL query
      const result = await rawClient.client.request(`
        query DocumentDetails($id: String!) {
          document(id: $id) {
            id
            title
            content
            createdAt
            updatedAt
            icon
            color
            creator {
              name
            }
          }
        }
      `, { id });
      
      const document = (result as any).document;
      
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      // Format the document data for display
      let formattedDocument = `# ${document.title}\n\n`;
      
      if (document.creator?.name) {
        formattedDocument += `Created by: ${document.creator.name}\n`;
        formattedDocument += `Created at: ${new Date(document.createdAt).toLocaleString()}\n\n`;
      }
      
      // Add the content
      if (document.content) {
        formattedDocument += document.content;
      } else {
        formattedDocument += '_No content_';
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: formattedDocument,
        }]
      };
    }
  );

  // Resource for listing all documents
  server.resource(
    "documents",
    new ResourceTemplate("linear://documents", { 
      list: async (_extra: RequestHandlerExtra) => {
        const rawClient = linearClient.getRawClient();
        
        // Fetch documents using a direct GraphQL query
        const result = await rawClient.client.request(`
          query Documents {
            documents(first: 100) {
              nodes {
                id
                title
              }
            }
          }
        `);
        
        const documents = (result as any).documents.nodes;
        
        return {
          resources: documents.map((document: any) => ({
            uri: `linear://documents/${document.id}`,
            name: document.title,
          }))
        };
      } 
    }),
    {
      description: "List of Linear documents",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // Fetch documents using a direct GraphQL query
      const result = await rawClient.client.request(`
        query Documents {
          documents(first: 100) {
            nodes {
              id
              title
              updatedAt
              createdAt
            }
          }
        }
      `);
      
      const documents = (result as any).documents.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: documents.map((document: any) => {
            const updatedAt = new Date(document.updatedAt).toLocaleDateString();
            return `- ${document.title} (Updated: ${updatedAt})`;
          }).join('\n'),
        }]
      };
    }
  );

  // Resource for team documents
  server.resource(
    "teamDocuments",
    new ResourceTemplate("linear://teams/{teamId}/documents", { list: undefined }),
    {
      description: "Documents for a specific team",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { teamId } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch team documents using a direct GraphQL query
      const result = await rawClient.client.request(`
        query TeamDocuments($teamId: String!) {
          team(id: $teamId) {
            name
            documents(first: 100) {
              nodes {
                id
                title
                updatedAt
              }
            }
          }
        }
      `, { teamId });
      
      const team = (result as any).team;
      
      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }
      
      const documents = (team as any).documents.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: `# Documents for ${team.name}\n\n` + 
            documents.map((document: any) => {
              const updatedAt = new Date(document.updatedAt).toLocaleDateString();
              return `- ${document.title} (Updated: ${updatedAt})`;
            }).join('\n'),
        }]
      };
    }
  );

  // Resource for project documents
  server.resource(
    "projectDocuments",
    new ResourceTemplate("linear://projects/{projectId}/documents", { list: undefined }),
    {
      description: "Documents for a specific project",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const { projectId } = variables;
      const rawClient = linearClient.getRawClient();
      
      // Fetch project documents using a direct GraphQL query
      const result = await rawClient.client.request(`
        query ProjectDocuments($projectId: String!) {
          project(id: $projectId) {
            name
            documents(first: 100) {
              nodes {
                id
                title
                updatedAt
              }
            }
          }
        }
      `, { projectId });
      
      const project = (result as any).project;
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      const documents = (project as any).documents.nodes;
      
      return {
        contents: [{
          uri: uri.href,
          text: `# Documents for ${project.name}\n\n` + 
            documents.map((document: any) => {
              const updatedAt = new Date(document.updatedAt).toLocaleDateString();
              return `- ${document.title} (Updated: ${updatedAt})`;
            }).join('\n'),
        }]
      };
    }
  );
}
