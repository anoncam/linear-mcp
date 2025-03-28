import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";

/**
 * Registers cycle-related tools with the MCP server.
 */
export function registerCycleTools(server: McpServer, linearClient: LinearClient) {
  // Tool to create a new cycle
  server.tool(
    "createCycle",
    "Create a new cycle/sprint in Linear",
    {
      teamId: z.string().describe("ID of the team to create the cycle in"),
      name: z.string().describe("Name of the cycle"),
      startsAt: z.string().describe("Start date in ISO format (YYYY-MM-DD)"),
      endsAt: z.string().describe("End date in ISO format (YYYY-MM-DD)"),
      description: z.string().optional().describe("Description of the cycle (supports Markdown)"),
    },
    async ({ teamId, name, startsAt, endsAt, description }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // Create the cycle
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.createCycle({
          teamId,
          name,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          description,
        });
        
        return {
          content: [{ 
            type: "text", 
            // @ts-ignore - The Linear SDK types may not be up to date
            text: `Cycle created: ${result.cycle.name}` 
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

  // Tool to update an existing cycle
  server.tool(
    "updateCycle",
    "Update an existing cycle in Linear",
    {
      id: z.string().describe("ID of the cycle to update"),
      name: z.string().optional().describe("New name of the cycle"),
      startsAt: z.string().optional().describe("New start date in ISO format (YYYY-MM-DD)"),
      endsAt: z.string().optional().describe("New end date in ISO format (YYYY-MM-DD)"),
      description: z.string().optional().describe("New description of the cycle (supports Markdown)"),
    },
    async ({ id, name, startsAt, endsAt, description }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // Prepare update data
        const updateData: Record<string, any> = {};
        if (name) updateData.name = name;
        if (startsAt) updateData.startsAt = new Date(startsAt);
        if (endsAt) updateData.endsAt = new Date(endsAt);
        if (description !== undefined) updateData.description = description;
        
        // Update the cycle
        // @ts-ignore - The Linear SDK types may not be up to date
        const result = await rawClient.updateCycle(id, updateData);
        
        return {
          content: [{ 
            type: "text", 
            // @ts-ignore - The Linear SDK types may not be up to date
            text: `Cycle updated: ${result.cycle.name}` 
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

  // Tool to add issues to a cycle
  server.tool(
    "addIssuesToCycle",
    "Add multiple issues to a cycle",
    {
      cycleId: z.string().describe("ID of the cycle"),
      issueIds: z.array(z.string()).describe("Array of issue IDs to add to the cycle"),
    },
    async ({ cycleId, issueIds }) => {
      try {
        const rawClient = linearClient.getRawClient();
        
        // Update each issue to add it to the cycle
        const updatePromises = issueIds.map(issueId => 
          rawClient.updateIssue(issueId, {
            cycleId,
          })
        );
        
        await Promise.all(updatePromises);
        
        return {
          content: [{ 
            type: "text", 
            text: `Added ${issueIds.length} issues to the cycle` 
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

  // Tool to get cycle analytics
  server.tool(
    "getCycleAnalytics",
    "Get analytics for a cycle",
    {
      cycleId: z.string().describe("ID of the cycle"),
    },
    async ({ cycleId }) => {
      try {
        const cycle = await linearClient.getCycle(cycleId);
        const issues = await cycle.issues();
        const team = await cycle.team || { name: "Unknown Team" };
        
        // Calculate metrics
        const totalIssues = issues.nodes.length;
        const completedIssues = issues.nodes.filter((issue: any) => issue.completedAt).length;
        const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
        
        // Calculate scope changes
        const addedIssues = issues.nodes.filter((issue: any) => {
          const createdAt = new Date(issue.createdAt);
          const cycleStartsAt = new Date(cycle.startsAt);
          return createdAt > cycleStartsAt;
        }).length;
        
        // Calculate average time to completion
        const completionTimes = issues.nodes
          .filter((issue: any) => issue.completedAt && issue.createdAt)
          .map((issue: any) => {
            const created = new Date(issue.createdAt).getTime();
            const completed = new Date(issue.completedAt).getTime();
            return (completed - created) / (1000 * 60 * 60 * 24); // days
          });
        
        const avgCompletionTime = completionTimes.length > 0
          ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length * 10) / 10
          : 0;
        
        // Format the analytics report
        const report = `# Cycle Analytics: ${cycle.name}

## Team: ${team.name}
- Duration: ${new Date(cycle.startsAt).toLocaleDateString()} to ${new Date(cycle.endsAt).toLocaleDateString()}
- Status: ${getCycleStatus(cycle)}

## Completion Metrics
- Total Issues: ${totalIssues}
- Completed Issues: ${completedIssues}
- Completion Rate: ${completionRate}%

## Scope Changes
- Issues Added During Cycle: ${addedIssues}
- Scope Change Rate: ${totalIssues > 0 ? Math.round((addedIssues / totalIssues) * 100) : 0}%

## Timing Metrics
- Average Time to Completion: ${avgCompletionTime} days

## Issue Breakdown
- High Priority Issues: ${issues.nodes.filter((issue: any) => issue.priority === 1 || issue.priority === 2).length}
- Medium/Low Priority Issues: ${issues.nodes.filter((issue: any) => issue.priority === 3 || issue.priority === 4).length}
- No Priority Assigned: ${issues.nodes.filter((issue: any) => !issue.priority).length}`;
        
        return {
          content: [{ 
            type: "text", 
            text: report
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

/**
 * Get the status of a cycle based on dates
 */
function getCycleStatus(cycle: any): string {
  const now = new Date();
  const startDate = new Date(cycle.startsAt);
  const endDate = new Date(cycle.endsAt);
  
  if (now < startDate) {
    return "Upcoming";
  } else if (now > endDate) {
    return "Completed";
  } else {
    return "Active";
  }
}
