import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LinearClient } from "../linear/client.js";
import { z } from "zod";

/**
 * Registers issue-related prompts with the MCP server.
 */
export function registerIssuePrompts(server: McpServer, linearClient: LinearClient) {
  // Prompt template for creating an issue
  server.prompt(
    "createIssue",
    "Template for creating a new issue in Linear",
    {
      teamId: z.string().describe("ID of the team to create the issue in"),
    },
    async ({ teamId }) => {
      try {
        // Get team info
        const team = await linearClient.getTeam(teamId);
        
        // Get team states
        const states = await linearClient.listWorkflowStates(teamId);
        const stateOptions = states.nodes.map(state => 
          `- ${state.name} (ID: ${state.id})`
        ).join('\n');
        
        // Get team members
        const members = await team.members();
        const memberOptions = members.nodes.map(member => 
          `- ${member.name} (ID: ${member.id})`
        ).join('\n');
        
        // Get team labels
        const labels = await linearClient.listLabels({ teamId });
        const labelOptions = labels.nodes.map(label => 
          `- ${label.name} (ID: ${label.id})`
        ).join('\n');
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to create a new issue in the "${team.name}" team on Linear. Please help me draft it.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'd be happy to help you create a new issue in the "${team.name}" team on Linear. Let's draft it together.

First, let's consider the key information needed:

1. **Title**: A clear, concise title describing the issue
2. **Description**: A detailed explanation of the issue (supports Markdown)
3. **Priority**: How important this issue is (1-Urgent, 2-High, 3-Medium, 4-Low)
4. **Workflow State**: The current status of the issue

For this team, here are the available workflow states:
${stateOptions}

Team members who could be assigned:
${memberOptions}

Available labels for this issue:
${labelOptions}

Let's start drafting your issue. What title would you like to give it?`
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
                text: `I want to create a new issue in Linear. Please help me draft it.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'd be happy to help you create a new issue in Linear. Let's draft it together.

First, let's consider the key information needed:

1. **Title**: A clear, concise title describing the issue
2. **Description**: A detailed explanation of the issue (supports Markdown)
3. **Priority**: How important this issue is (1-Urgent, 2-High, 3-Medium, 4-Low)
4. **Workflow State**: The current status of the issue

Let's start drafting your issue. What title would you like to give it?`
              }
            }
          ]
        };
      }
    }
  );

  // Prompt template for bug report
  server.prompt(
    "bugReport",
    "Template for creating a bug report in Linear",
    {
      teamId: z.string().describe("ID of the team to create the bug report in"),
    },
    async ({ teamId }) => {
      try {
        // Get team info
        const team = await linearClient.getTeam(teamId);
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to report a bug for the "${team.name}" team on Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you create a well-structured bug report for the "${team.name}" team on Linear. Let's gather all the necessary information:

## Bug Report Template

Please provide the following details:

### 1. Bug Summary
What's happening? Keep it brief and clear.

### 2. Expected Behavior
What should happen instead?

### 3. Actual Behavior
What's actually happening?

### 4. Steps to Reproduce
1. 
2. 
3. 

### 5. Environment
- Browser/App version: 
- OS: 
- Device: 

### 6. Screenshots/Videos
If applicable, please describe any visual evidence you can provide.

### 7. Impact/Severity
How serious is this bug? (Critical, Major, Minor, Trivial)

### 8. Additional Context
Any other information that might be relevant?

Let's start filling in this template. What's happening with the bug you'd like to report?`
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
                text: `I want to report a bug in Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you create a well-structured bug report for Linear. Let's gather all the necessary information:

## Bug Report Template

Please provide the following details:

### 1. Bug Summary
What's happening? Keep it brief and clear.

### 2. Expected Behavior
What should happen instead?

### 3. Actual Behavior
What's actually happening?

### 4. Steps to Reproduce
1. 
2. 
3. 

### 5. Environment
- Browser/App version: 
- OS: 
- Device: 

### 6. Screenshots/Videos
If applicable, please describe any visual evidence you can provide.

### 7. Impact/Severity
How serious is this bug? (Critical, Major, Minor, Trivial)

### 8. Additional Context
Any other information that might be relevant?

Let's start filling in this template. What's happening with the bug you'd like to report?`
              }
            }
          ]
        };
      }
    }
  );

  // Prompt template for feature request
  server.prompt(
    "featureRequest",
    "Template for creating a feature request in Linear",
    {
      teamId: z.string().describe("ID of the team to create the feature request in"),
    },
    async ({ teamId }) => {
      try {
        // Get team info
        const team = await linearClient.getTeam(teamId);
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I want to request a new feature for the "${team.name}" team on Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you create a well-structured feature request for the "${team.name}" team on Linear. Let's gather all the necessary information:

## Feature Request Template

Please provide the following details:

### 1. Feature Summary
What feature would you like to see added? Keep it brief and clear.

### 2. Problem Statement
What problem does this feature solve? Why is it needed?

### 3. Proposed Solution
How do you envision this feature working?

### 4. User Stories
As a [type of user], I want [goal] so that [benefit].

### 5. Acceptance Criteria
What specific requirements should this feature meet to be considered complete?
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### 6. Business Value
How does this feature contribute to business goals or user satisfaction?

### 7. Alternatives Considered
Have you thought of other ways to solve this problem?

### 8. Additional Context
Any other information, mockups, or examples that might be helpful?

Let's start filling in this template. What feature would you like to request?`
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
                text: `I want to request a new feature in Linear.`
              }
            },
            {
              role: "assistant",
              content: {
                type: "text",
                text: `I'll help you create a well-structured feature request for Linear. Let's gather all the necessary information:

## Feature Request Template

Please provide the following details:

### 1. Feature Summary
What feature would you like to see added? Keep it brief and clear.

### 2. Problem Statement
What problem does this feature solve? Why is it needed?

### 3. Proposed Solution
How do you envision this feature working?

### 4. User Stories
As a [type of user], I want [goal] so that [benefit].

### 5. Acceptance Criteria
What specific requirements should this feature meet to be considered complete?
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### 6. Business Value
How does this feature contribute to business goals or user satisfaction?

### 7. Alternatives Considered
Have you thought of other ways to solve this problem?

### 8. Additional Context
Any other information, mockups, or examples that might be helpful?

Let's start filling in this template. What feature would you like to request?`
              }
            }
          ]
        };
      }
    }
  );
}
