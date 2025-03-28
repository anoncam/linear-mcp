import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";

/**
 * Registers cycle-related prompts with the MCP server.
 */
export function registerCyclePrompts(server: McpServer, linearClient: LinearClient) {
  // Prompt template for sprint planning
  server.prompt(
    "sprintPlanning",
    "Template for planning a sprint/cycle in Linear",
    {
      teamId: z.string().describe("ID of the team to create the cycle for"),
    },
    async ({ teamId }) => {
      try {
        // Get team info
        const team = await linearClient.getTeam(teamId);
        
        // Get backlog issues
        const rawClient = linearClient.getRawClient();
        const backlogState = (await linearClient.listWorkflowStates(teamId)).nodes
          .find(state => state.name.toLowerCase() === "backlog");
        
        let backlogIssues: any[] = [];
        if (backlogState) {
          const result = await rawClient.issues({
            filter: {
              team: { id: { eq: teamId } },
              state: { id: { eq: backlogState.id } },
              // @ts-ignore - The Linear SDK types may not be up to date
              cycle: { id: { isNull: true } }
            },
            first: 20
          });
          backlogIssues = result.nodes;
        }
        
        // Format backlog issues for display
        const backlogList = await Promise.all(backlogIssues.map(async issue => 
          `- ${issue.identifier}: ${issue.title} (Priority: ${issue.priority || 'None'}, Estimate: ${issue.estimate || 'None'})`
        )).then(lines => lines.join('\n'));
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to plan a new sprint for the "${team.name}" team on Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you plan a new sprint/cycle for the "${team.name}" team. Let's organize this process:

## Sprint Planning Template

### 1. Sprint Details
- Sprint Name: 
- Start Date: 
- End Date: 
- Sprint Goal: 

### 2. Team Capacity
- Available team members:
- Total capacity (story points/hours):
- Accounting for time off/meetings:

### 3. Backlog Issues Available
${backlogIssues.length > 0 ? backlogList : "No backlog issues found. You may need to create some issues first."}

### 4. Issues to Include
List the issues you want to include in this sprint:
1. 
2. 
3. 

### 5. Acceptance Criteria
What will make this sprint successful?
- 
- 

### 6. Risks and Dependencies
Any potential blockers or dependencies to be aware of?
- 
- 

Let's start by defining the sprint details. What would you like to name this sprint and when should it start and end?`
              }
            }
          ]
        };
      } catch (error) {
        // Fallback if we can't get team info
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to plan a new sprint in Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you plan a new sprint/cycle in Linear. Let's organize this process:

## Sprint Planning Template

### 1. Sprint Details
- Sprint Name: 
- Start Date: 
- End Date: 
- Sprint Goal: 

### 2. Team Capacity
- Available team members:
- Total capacity (story points/hours):
- Accounting for time off/meetings:

### 3. Issues to Include
List the issues you want to include in this sprint:
1. 
2. 
3. 

### 4. Acceptance Criteria
What will make this sprint successful?
- 
- 

### 5. Risks and Dependencies
Any potential blockers or dependencies to be aware of?
- 
- 

Let's start by defining the sprint details. What would you like to name this sprint and when should it start and end?`
              }
            }
          ]
        };
      }
    }
  );

  // Prompt template for sprint retrospective
  server.prompt(
    "sprintRetrospective",
    "Template for conducting a sprint retrospective in Linear",
    {
      cycleId: z.string().describe("ID of the completed cycle"),
    },
    async ({ cycleId }) => {
      try {
        // Get cycle info
        const cycle = await linearClient.getCycle(cycleId);
        const team = await cycle.team || { name: "Unknown Team" };
        
        // Get cycle issues
        const issues = await cycle.issues();
        
        // Calculate completion metrics
        const totalIssues = issues.nodes.length;
        const completedIssues = issues.nodes.filter(issue => issue.completedAt).length;
        const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to conduct a retrospective for the "${cycle.name}" sprint that just completed.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you conduct a retrospective for the "${cycle.name}" sprint. Here's what we know:

**Sprint**: ${cycle.name}
**Team**: ${team.name}
**Duration**: ${new Date(cycle.startsAt).toLocaleDateString()} to ${new Date(cycle.endsAt).toLocaleDateString()}
**Completion Rate**: ${completionRate}% (${completedIssues}/${totalIssues} issues completed)

## Sprint Retrospective Template

### 1. What Went Well
What successes did the team have during this sprint?
- 
- 
- 

### 2. What Could Be Improved
What challenges or obstacles did the team face?
- 
- 
- 

### 3. Action Items
What specific actions can we take to improve in the next sprint?
- [ ] 
- [ ] 
- [ ] 

### 4. Kudos
Who deserves recognition for their contributions?
- 
- 

### 5. Sprint Metrics Review
- Velocity: 
- Scope changes: 
- Quality issues: 

### 6. Looking Ahead
What should we focus on in the next sprint?
- 
- 

Let's start by discussing what went well during this sprint. What successes would you like to highlight?`
              }
            }
          ]
        };
      } catch (error) {
        // Fallback if we can't get cycle info
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to conduct a sprint retrospective in Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you conduct a sprint retrospective. Let's structure our discussion:

## Sprint Retrospective Template

### 1. What Went Well
What successes did the team have during this sprint?
- 
- 
- 

### 2. What Could Be Improved
What challenges or obstacles did the team face?
- 
- 
- 

### 3. Action Items
What specific actions can we take to improve in the next sprint?
- [ ] 
- [ ] 
- [ ] 

### 4. Kudos
Who deserves recognition for their contributions?
- 
- 

### 5. Sprint Metrics Review
- Velocity: 
- Scope changes: 
- Quality issues: 

### 6. Looking Ahead
What should we focus on in the next sprint?
- 
- 

Let's start by discussing what went well during this sprint. What successes would you like to highlight?`
              }
            }
          ]
        };
      }
    }
  );

  // Prompt template for team update
  server.prompt(
    "teamUpdate",
    "Template for creating a team update in Linear",
    {
      teamId: z.string().describe("ID of the team to create the update for"),
    },
    async ({ teamId }) => {
      try {
        // Get team info
        const team = await linearClient.getTeam(teamId);
        
        // Get active cycle
        const cycles = await linearClient.listCycles(teamId);
        const now = new Date();
        const activeCycle = cycles.nodes.find(cycle => {
          const startDate = new Date(cycle.startsAt);
          const endDate = new Date(cycle.endsAt);
          return startDate <= now && endDate >= now;
        });
        
        // Get recent issues
        const rawClient = linearClient.getRawClient();
        const recentIssues = await rawClient.issues({
          filter: {
            team: { id: { eq: teamId } },
            // @ts-ignore - The Linear SDK types may not be up to date
            updatedAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          },
          // @ts-ignore - The Linear SDK types may not be up to date
          orderBy: "updatedAt",
          first: 10
        });
        
        // Format recent issues for display
        const recentIssuesList = await Promise.all(recentIssues.nodes.map(async issue => {
          const state = await issue.state;
          return `- ${issue.identifier}: ${issue.title} (${state?.name || 'Unknown state'})`;
        })).then(lines => lines.join('\n'));
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to create a team update for the "${team.name}" team on Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you create a team update for the "${team.name}" team. Here's a template to get started:

## Team Update: ${team.name}
**Date**: ${new Date().toLocaleDateString()}
${activeCycle ? `**Current Sprint**: ${activeCycle.name} (${Math.round((now.getTime() - new Date(activeCycle.startsAt).getTime()) / (new Date(activeCycle.endsAt).getTime() - new Date(activeCycle.startsAt).getTime()) * 100)}% complete)` : ''}

### 1. Accomplishments
What has the team accomplished since the last update?
- 
- 
- 

### 2. In Progress
What is the team currently working on?
- 
- 
- 

### 3. Blockers
Are there any blockers or challenges the team is facing?
- 
- 

### 4. Upcoming Work
What will the team be focusing on next?
- 
- 

### 5. Recent Activity
${recentIssuesList || "No recent activity found."}

### 6. Team Metrics
- Issues completed: 
- Cycle progress: 
- Current velocity: 

Let's start by filling in the accomplishments section. What has the team accomplished since the last update?`
              }
            }
          ]
        };
      } catch (error) {
        // Fallback if we can't get team info
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to create a team update in Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you create a team update for Linear. Here's a template to get started:

## Team Update
**Date**: ${new Date().toLocaleDateString()}

### 1. Accomplishments
What has the team accomplished since the last update?
- 
- 
- 

### 2. In Progress
What is the team currently working on?
- 
- 
- 

### 3. Blockers
Are there any blockers or challenges the team is facing?
- 
- 

### 4. Upcoming Work
What will the team be focusing on next?
- 
- 

### 5. Team Metrics
- Issues completed: 
- Cycle progress: 
- Current velocity: 

Let's start by filling in the accomplishments section. What has the team accomplished since the last update?`
              }
            }
          ]
        };
      }
    }
  );
}
