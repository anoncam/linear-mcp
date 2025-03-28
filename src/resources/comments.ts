import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { Variables } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Registers comment-related resources with the MCP server.
 */
export function registerCommentResources(server: McpServer, linearClient: LinearClient) {
  // Resource for a specific comment
  server.resource(
    "comment",
    new ResourceTemplate("linear://comments/{id}", { list: undefined }),
    {
      description: "A Linear comment with all its details",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const id = variables.id as string;
      const comment = await linearClient.getComment(id);
      
      return {
        contents: [{
          uri: uri.href,
          text: await formatCommentForDisplay(comment),
        }]
      };
    }
  );

  // Resource for issue comments
  server.resource(
    "issueComments",
    new ResourceTemplate("linear://issues/{issueId}/comments", { list: undefined }),
    {
      description: "Comments on a specific issue",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const issueId = variables.issueId as string;
      const comments = await linearClient.listComments(issueId);
      
      return {
        contents: [{
          uri: uri.href,
          text: await Promise.all(comments.nodes.map(async comment => {
            const user = await comment.user;
            return `### ${user?.name || 'Unknown User'} (${new Date(comment.createdAt).toLocaleString()})\n${comment.body}`;
          })).then(sections => sections.join('\n\n---\n\n')),
        }]
      };
    }
  );

  // Resource for user comments
  server.resource(
    "userComments",
    new ResourceTemplate("linear://users/{userId}/comments", { list: undefined }),
    {
      description: "Comments created by a specific user",
    },
    async (uri: URL, variables: Variables): Promise<ReadResourceResult> => {
      const userId = variables.userId as string;
      const rawClient = linearClient.getRawClient();
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.comments({
        filter: {
          user: { id: { eq: userId } }
        },
        first: 20,
        // @ts-ignore - The Linear SDK types may not be up to date
        orderBy: "createdAt"
      });
      
      return {
        contents: [{
          uri: uri.href,
          text: await Promise.all(result.nodes.map(async (comment: any) => {
            const issue = await comment.issue;
            return `### ${issue?.identifier || 'Unknown Issue'}: ${issue?.title || 'Unknown Title'} (${new Date(comment.createdAt).toLocaleString()})\n${comment.body}`;
          })).then(sections => sections.join('\n\n---\n\n')),
        }]
      };
    }
  );

  // Resource for recent comments
  server.resource(
    "recentComments",
    new ResourceTemplate("linear://comments/recent", { list: undefined }),
    {
      description: "Recent comments across all issues",
    },
    async (uri: URL): Promise<ReadResourceResult> => {
      const rawClient = linearClient.getRawClient();
      
      // @ts-ignore - The Linear SDK types may not be up to date
      const result = await rawClient.comments({
        first: 20,
        // @ts-ignore - The Linear SDK types may not be up to date
        orderBy: "createdAt"
      });
      
      return {
        contents: [{
          uri: uri.href,
          text: await Promise.all(result.nodes.map(async (comment: any) => {
            const user = await comment.user;
            const issue = await comment.issue;
            return `### ${user?.name || 'Unknown User'} on ${issue?.identifier || 'Unknown Issue'} (${new Date(comment.createdAt).toLocaleString()})\n${comment.body}`;
          })).then(sections => sections.join('\n\n---\n\n')),
        }]
      };
    }
  );
}

/**
 * Format a comment for display
 */
async function formatCommentForDisplay(comment: any): Promise<string> {
  const user = await comment.user;
  const issue = await comment.issue;
  
  let result = `# Comment by ${user?.name || 'Unknown User'}\n\n`;
  result += `Created: ${new Date(comment.createdAt).toLocaleString()}\n`;
  if (comment.updatedAt !== comment.createdAt) {
    result += `Updated: ${new Date(comment.updatedAt).toLocaleString()}\n`;
  }
  result += `Issue: ${issue?.identifier || 'Unknown'}: ${issue?.title || 'Unknown'}\n\n`;
  result += `## Content\n\n${comment.body}\n\n`;
  
  return result;
}
