import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";

/**
 * Registers comment-related tools with the MCP server.
 */
export function registerCommentTools(server: McpServer, linearClient: LinearClient) {
  // Tool to create a comment on an issue
  server.tool(
    "createComment",
    "Create a new comment on a Linear issue",
    {
      issueId: z.string().describe("ID of the issue to comment on"),
      body: z.string().describe("Comment text (supports Markdown)"),
    },
    async ({ issueId, body }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // Create the comment
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.createComment({
          issueId,
          body,
        });
        
        return {
          content: [{ 
            type: "text", 
            // @ts-ignore - The Linear SDK types may not be up to date
            text: `Comment created on issue` 
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

  // Tool to update an existing comment
  server.tool(
    "updateComment",
    "Update an existing comment in Linear",
    {
      id: z.string().describe("ID of the comment to update"),
      body: z.string().describe("New comment text (supports Markdown)"),
    },
    async ({ id, body }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // Update the comment
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.updateComment(id, {
          body,
        });
        
        return {
          content: [{ 
            type: "text", 
            text: `Comment updated` 
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

  // Tool to delete a comment
  server.tool(
    "deleteComment",
    "Delete a comment from Linear",
    {
      id: z.string().describe("ID of the comment to delete"),
    },
    async ({ id }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // Delete the comment
        // @ts-ignore - The Linear SDK types may not be up to date
        await rawClient.deleteComment(id);
        
        return {
          content: [{ 
            type: "text", 
            text: `Comment deleted` 
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

  // Tool to add a reaction to a comment
  server.tool(
    "addCommentReaction",
    "Add a reaction emoji to a comment",
    {
      commentId: z.string().describe("ID of the comment to react to"),
      emoji: z.string().describe("Emoji to use as reaction (e.g., '👍', '❤️', '🎉')"),
    },
    async ({ commentId, emoji }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // Add reaction
        // @ts-ignore - The Linear SDK types may not be up to date
        await rawClient.createReaction({
          commentId,
          emoji,
        });
        
        return {
          content: [{ 
            type: "text", 
            text: `Added ${emoji} reaction to comment` 
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

  // Tool to get comment thread
  server.tool(
    "getCommentThread",
    "Get a comment and its replies as a thread",
    {
      commentId: z.string().describe("ID of the parent comment"),
    },
    async ({ commentId }) => {
      try {
        const comment = await linearClient.getComment(commentId);
        const user = await comment.user;
        
        // Get replies
        // @ts-ignore - The Linear SDK types may not be up to date
        const replies = await comment.children();
        
        // Format the thread
        let threadText = `# Comment Thread\n\n`;
        threadText += `## Original Comment by ${user?.name || 'Unknown User'} (${new Date(comment.createdAt).toLocaleString()})\n\n`;
        threadText += `${comment.body}\n\n`;
        
        if (replies.nodes.length > 0) {
          threadText += `## Replies\n\n`;
          
          for (const reply of replies.nodes) {
            const replyUser = await reply.user;
            threadText += `### ${replyUser?.name || 'Unknown User'} (${new Date(reply.createdAt).toLocaleString()})\n\n`;
            threadText += `${reply.body}\n\n`;
          }
        } else {
          threadText += `*No replies yet*\n\n`;
        }
        
        return {
          content: [{ 
            type: "text", 
            text: threadText
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
