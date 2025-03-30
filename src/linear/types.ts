/**
 * Common types for Linear resources that will be used throughout the application.
 * These are simplified versions of the Linear SDK types for use in our MCP server.
 */

export interface LinearPaginationOptions {
  first?: number;
  after?: string;
}

export interface ListResourcesCallback {
  resources: { uri: string; name: string; description?: string }[];
  nextCursor?: string;
}

// Base type for Linear entities
export interface LinearEntity {
  id: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

// Issue-related types
export interface IssueFilterOptions extends LinearPaginationOptions {
  teamIds?: string[];
  states?: string[];
  assigneeId?: string;
  priority?: number;
  labelIds?: string[];
}

export interface IssueCreateInput {
  title: string;
  description?: string;
  teamId: string;
  stateId?: string;
  assigneeId?: string;
  priority?: number;
  labelIds?: string[];
  dueDate?: string;
}

export interface IssueUpdateInput {
  title?: string;
  description?: string;
  stateId?: string;
  assigneeId?: string;
  priority?: number;
  labelIds?: string[];
  dueDate?: string;
}

// Project-related types
export interface ProjectFilterOptions extends LinearPaginationOptions {
  teamIds?: string[];
  states?: string[];
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  teamId: string;
  state?: string;
  targetDate?: string;
}

// Comment-related types
export interface CommentCreateInput {
  issueId: string;
  body: string;
}

// Attachment-related types
export interface AttachmentCreateInput {
  issueId: string;
  title: string;
  url: string;
  subtitle?: string;
  iconUrl?: string;
}

export interface AttachmentUpdateInput {
  title?: string;
  url?: string;
  subtitle?: string;
  iconUrl?: string;
}

// This interface should match the Attachment type from Linear SDK
export interface LinearAttachment {
  id: string;
  title: string;
  url: string;
  subtitle?: string;
  iconUrl?: string;
  // Using any to accommodate both Date and string formats
  createdAt?: any;
  updatedAt?: any;
}

// Helper functions to format Linear entities for better presentation
export async function formatIssueForDisplay(issue: any): Promise<string> {
  let result = "# " + issue.identifier + ": " + issue.title + "\n  \n";
  result += "State: " + ((await issue.state)?.name || 'Unknown') + "\n";
  result += "Assignee: " + ((await issue.assignee)?.name || 'Unassigned') + "\n";
  result += "Priority: " + priorityToString(issue.priority) + "\n";
  result += "Created: " + new Date(issue.createdAt).toLocaleString() + "\n  \n";
  result += issue.description || 'No description provided.';
  result += "\n  \n";
  result += issue.url;

  return result;
}

export async function formatProjectForDisplay(project: any): Promise<string> {
  let result = "# " + project.name + "\n  \n";
  result += "State: " + (project.state || 'Unknown') + "\n";
  result += "Team: " + ((await project.team)?.name || 'Unknown') + "\n";

  if (project.targetDate) {
    result += "Target Date: " + new Date(project.targetDate).toLocaleDateString() + "\n";
  }

  result += "\n  \n";
  result += project.description || 'No description provided.';

  return result;
}

export async function formatTeamForDisplay(team: any): Promise<string> {
  let result = "# " + team.name + "\n  \n";
  result += "Key: " + team.key + "\n";
  result += "Description: " + (team.description || 'No description provided.') + "\n  \n";

  // Process members info
  const membersInfo = (await team.members)?.nodes?.length
    ? "Members: " + (await Promise.all((await team.members).nodes.map(async (m: any) => (await m.user).name))).join(', ')
    : "No members.";

  result += membersInfo;

  return result;
}

export async function formatUserForDisplay(user: any): Promise<string> {
  let result = "# " + user.name + "\n\n";
  result += "Email: " + user.email + "\n";
  result += "Role: " + (user.admin ? 'Admin' : 'Member') + "\n";

  // Process teams info
  const teamsInfo = (await user.teams)?.nodes?.length
    ? "Teams: " + (await Promise.all((await user.teams).nodes.map(async (t: any) => (await t.team).name))).join(', ')
    : "No teams.";

  result += teamsInfo;

  return result;
}

export function priorityToString(priority: number | null | undefined): string {
  if (priority === null || priority === undefined) return 'No priority';

  switch (priority) {
    case 0: return 'No priority';
    case 1: return 'Urgent';
    case 2: return 'High';
    case 3: return 'Medium';
    case 4: return 'Low';
    default: return "Priority " + priority;
  }
}
