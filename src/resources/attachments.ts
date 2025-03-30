import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { LinearAttachment } from "../linear/types.js";

/**
 * Registers attachment-related resources with the MCP server.
 */
export function registerAttachmentResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific attachment
  server.resource(
    "attachment",
    new ResourceTemplate("linear://attachments/{id}", { list: undefined }),
    {
      description: "A Linear attachment with its details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const id = variables.id as string;
      const attachment = await linearClient.getAttachment(id);

      return {
        contents: [{
          uri: uri.href,
          text: `# Attachment: ${attachment.title}\n\n${attachment.subtitle || ''}\n\nURL: ${attachment.url}`,
        }]
      };
    }
  );

  // Resource for listing all attachments for an issue
  server.resource(
    "issueAttachments",
    new ResourceTemplate("linear://issues/{issueId}/attachments", { list: undefined }),
    {
      description: "List of attachments for a specific Linear issue",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const issueId = variables.issueId as string;

      try {
        const result = await linearClient.listAttachments(issueId);
        const attachments = result.nodes;

        if (attachments.length === 0) {
          return {
            contents: [{
              uri: uri.href,
              text: "No attachments found for this issue.",
            }]
          };
        }

        const attachmentList = attachments.map((attachment: LinearAttachment) =>
          `- [${attachment.title}](${attachment.url})${attachment.subtitle ? ` - ${attachment.subtitle}` : ''}`
        ).join('\n');

        return {
          contents: [{
            uri: uri.href,
            text: `# Attachments for Issue\n\n${attachmentList}`,
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: `Error retrieving attachments: ${(error as Error).message}`,
          }]
        };
      }
    }
  );
}
