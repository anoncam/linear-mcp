import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";

/**
 * Registers project-related prompts with the MCP server.
 */
export function registerProjectPrompts(server: McpServer, linearClient: LinearClient) {
  // Prompt template for creating a project
  server.prompt(
    "createProject",
    "Template for creating a new project in Linear",
    {
      teamId: z.string().describe("ID of the team to create the project in"),
    },
    async ({ teamId }) => {
      try {
        // Get team info
        const team = await linearClient.getTeam(teamId);
        
        // Get team members
        const members = await team.members();
        const memberOptions = members.nodes.map(member => 
          `- ${member.name} (ID: ${member.id})`
        ).join('\n');
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to create a new project in the "${team.name}" team on Linear. Please help me draft it.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'd be happy to help you create a new project in the "${team.name}" team on Linear. Let's draft it together.

First, let's consider the key information needed:

1. **Project Name**: A clear, concise name for your project
2. **Description**: A detailed explanation of the project's purpose and goals (supports Markdown)
3. **Project State**: The current status (backlog, planned, started, completed, canceled)
4. **Target Date**: When the project should be completed (if applicable)

Team members who could be involved:
${memberOptions}

Let's start drafting your project. What name would you like to give it?`
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
                text: `I want to create a new project in Linear. Please help me draft it.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'd be happy to help you create a new project in Linear. Let's draft it together.

First, let's consider the key information needed:

1. **Project Name**: A clear, concise name for your project
2. **Description**: A detailed explanation of the project's purpose and goals (supports Markdown)
3. **Project State**: The current status (backlog, planned, started, completed, canceled)
4. **Target Date**: When the project should be completed (if applicable)

Let's start drafting your project. What name would you like to give it?`
              }
            }
          ]
        };
      }
    }
  );

  // Prompt template for project planning
  server.prompt(
    "projectPlanning",
    "Template for planning a project with issues in Linear",
    {
      teamId: z.string().describe("ID of the team to create the project in"),
    },
    async ({ teamId }) => {
      try {
        // Get team info
        const team = await linearClient.getTeam(teamId);
        
        // Get workflow states
        const states = await linearClient.listWorkflowStates(teamId);
        const stateOptions = states.nodes.map(state => 
          `- ${state.name} (ID: ${state.id})`
        ).join('\n');
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to plan a new project with issues in the "${team.name}" team on Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you plan a comprehensive project with issues for the "${team.name}" team on Linear. Let's break this down into steps:

## Project Planning Template

### 1. Project Overview
- Project Name: 
- Project Description: 
- Project Objective: 
- Target Start Date: 
- Target Completion Date: 

### 2. Project Phases
Let's organize your project into logical phases (e.g., Research, Design, Development, Testing, Launch).

### 3. Key Deliverables
What are the main outputs or deliverables for this project?

### 4. Issue Breakdown
For each phase, we'll create issues in Linear. Available workflow states:
${stateOptions}

#### Phase 1: [Name]
- Issue 1: [Title]
  - Description: 
  - Priority (1-Urgent, 2-High, 3-Medium, 4-Low): 
  - Estimated effort: 

- Issue 2: [Title]
  - Description: 
  - Priority: 
  - Estimated effort: 

#### Phase 2: [Name]
...and so on

### 5. Dependencies
Are there any dependencies between issues that need to be tracked?

### 6. Success Criteria
How will you know when this project is successfully completed?

Let's start by filling in the Project Overview. What name would you like to give your project?`
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
                text: `I want to plan a new project with issues in Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you plan a comprehensive project with issues in Linear. Let's break this down into steps:

## Project Planning Template

### 1. Project Overview
- Project Name: 
- Project Description: 
- Project Objective: 
- Target Start Date: 
- Target Completion Date: 

### 2. Project Phases
Let's organize your project into logical phases (e.g., Research, Design, Development, Testing, Launch).

### 3. Key Deliverables
What are the main outputs or deliverables for this project?

### 4. Issue Breakdown
For each phase, we'll create issues in Linear.

#### Phase 1: [Name]
- Issue 1: [Title]
  - Description: 
  - Priority (1-Urgent, 2-High, 3-Medium, 4-Low): 
  - Estimated effort: 

- Issue 2: [Title]
  - Description: 
  - Priority: 
  - Estimated effort: 

#### Phase 2: [Name]
...and so on

### 5. Dependencies
Are there any dependencies between issues that need to be tracked?

### 6. Success Criteria
How will you know when this project is successfully completed?

Let's start by filling in the Project Overview. What name would you like to give your project?`
              }
            }
          ]
        };
      }
    }
  );

  // Prompt template for project status update
  server.prompt(
    "projectStatusUpdate",
    "Template for creating a project status update in Linear",
    {
      projectId: z.string().describe("ID of the project to update"),
    },
    async ({ projectId }) => {
      try {
        // Get project info
        const project = await linearClient.getProject(projectId);
        
        // Get project issues
        const rawClient = linearClient.getRawClient();
        const result = await rawClient.issues({
          filter: {
            project: { id: { eq: projectId } }
          },
          first: 100
        });
        
        const issues = result.nodes;
        
        // Count issues by state
        const stateCount: Record<string, number> = {};
        
        // Process issues and count by state
        for (const issue of issues) {
          // Use a type assertion to access the state name
          // @ts-ignore - The Linear SDK types may not be up to date
          const stateName = issue.state?.name || 'Unknown';
          stateCount[stateName] = (stateCount[stateName] || 0) + 1;
        }
        
        const issueStats = Object.entries(stateCount)
          .map(([state, count]) => `- ${state}: ${count}`)
          .join('\n');
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I need to create a status update for the "${project.name}" project in Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you create a status update for the "${project.name}" project. Here's what we know:

**Project**: ${project.name}
**State**: ${project.state || 'Not specified'}
${project.targetDate ? `**Target Date**: ${new Date(project.targetDate).toLocaleDateString()}` : ''}

**Issue Summary**:
${issueStats}

Let's create a comprehensive status update. Here's a template you can use:

## Project Status Update: ${project.name}

### Overall Status
[ON TRACK / AT RISK / OFF TRACK]

### Accomplishments This Period
- 
- 
- 

### Goals For Next Period
- 
- 
- 

### Blockers / Issues
- 
- 

### Resources Needed
- 
- 

### Notes & Additional Context
- 

What would you like to include in your status update? Let's start with the overall status.`
              }
            }
          ]
        };
      } catch (error) {
        // If there's an error getting project data, provide a generic template
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I need to create a status update for a project in Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you create a project status update for Linear. Here's a template you can use:

## Project Status Update

### Project Information
- **Project Name**: 
- **Team**: 
- **Current Phase**:
- **Target Completion Date**:

### Overall Status
[ON TRACK / AT RISK / OFF TRACK]

### Accomplishments This Period
- 
- 
- 

### Goals For Next Period
- 
- 
- 

### Blockers / Issues
- 
- 

### Resources Needed
- 
- 

### Notes & Additional Context
- 

What would you like to include in your status update? Let's start with the project information.`
              }
            }
          ]
        };
      }
    }
  );
}
