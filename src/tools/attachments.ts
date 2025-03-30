import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";
import { LinearAttachment } from "../linear/types.js";

/**
 * Registers attachment-related tools with the MCP server.
 */
export function registerAttachmentTools(server: McpServer, linearClient: LinearClient) {
  // Tool to create a new attachment for an issue
  server.tool(
    "createAttachment",
    "Create a new attachment for an issue in Linear",
    {
      issueId: z.string().describe("ID of the issue to add attachment to"),
      title: z.string().describe("Title of the attachment"),
      url: z.string().url().describe("URL of the attachment"),
      subtitle: z.string().optional().describe("Optional subtitle/description for the attachment"),
      iconUrl: z.string().url().optional().describe("Optional URL for an icon to display with the attachment"),
    },
    async ({ issueId, title, url, subtitle, iconUrl }) => {
      try {
        // Create the attachment
        await linearClient.createAttachment({
          issueId,
          title,
          url,
          subtitle,
          iconUrl,
        });

        return {
          content: [{
            type: "text",
            text: `Attachment "${title}" created successfully`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool to update an existing attachment
  server.tool(
    "updateAttachment",
    "Update an existing attachment in Linear",
    {
      id: z.string().describe("ID of the attachment to update"),
      title: z.string().optional().describe("New title of the attachment"),
      url: z.string().url().optional().describe("New URL of the attachment"),
      subtitle: z.string().optional().describe("New subtitle/description for the attachment"),
      iconUrl: z.string().url().optional().describe("New URL for an icon to display with the attachment"),
    },
    async ({ id, title, url, subtitle, iconUrl }) => {
      try {
        await linearClient.updateAttachment(id, {
          title,
          url,
          subtitle,
          iconUrl,
        });

        return {
          content: [{
            type: "text",
            text: `Attachment updated successfully`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool to delete an attachment
  server.tool(
    "deleteAttachment",
    "Delete an attachment from Linear",
    {
      id: z.string().describe("ID of the attachment to delete"),
    },
    async ({ id }) => {
      try {
        await linearClient.deleteAttachment(id);

        return {
          content: [{
            type: "text",
            text: `Attachment deleted successfully`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool to list attachments for an issue
  server.tool(
    "listAttachments",
    "List all attachments for an issue",
    {
      issueId: z.string().describe("ID of the issue to list attachments for"),
    },
    async ({ issueId }) => {
      try {
        const result = await linearClient.listAttachments(issueId);
        const attachments = result.nodes;

        if (attachments.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No attachments found for this issue."
            }]
          };
        }

        const attachmentList = attachments.map((attachment: LinearAttachment) =>
          `- ${attachment.title}${attachment.subtitle ? ` - ${attachment.subtitle}` : ''}\n  URL: ${attachment.url}${attachment.id ? `\n  ID: ${attachment.id}` : ''}`
        ).join('\n\n');

        return {
          content: [{
            type: "text",
            text: `Found ${attachments.length} attachments:\n\n${attachmentList}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
}
