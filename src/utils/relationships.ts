/**
 * Utilities for handling relationships between Linear entities.
 */

import { LinearClient } from "../linear/client.js";

/**
 * A class that helps with retrieving related entities in Linear.
 */
export class RelationshipManager {
  private linearClient: LinearClient;

  constructor(linearClient: LinearClient) {
    this.linearClient = linearClient;
  }

  /**
   * Gets all issues for a given project.
   *
   * @param projectId - ID of the project
   * @returns Promise resolving to an array of issues
   */
  async getIssuesForProject(projectId: string) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL capabilities
    const rawClient = this.linearClient.getRawClient();
    return rawClient.issues({
      filter: {
        project: { id: { eq: projectId } }
      } as any
    });
  }

  /**
   * Gets all issues for a given cycle.
   *
   * @param cycleId - ID of the cycle
   * @returns Promise resolving to an array of issues
   */
  async getIssuesForCycle(cycleId: string) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL capabilities
    const rawClient = this.linearClient.getRawClient();
    return rawClient.issues({
      filter: {
        cycle: { id: { eq: cycleId } }
      } as any
    });
  }

  /**
   * Gets all issues with a specific label.
   *
   * @param labelId - ID of the label
   * @returns Promise resolving to an array of issues
   */
  async getIssuesWithLabel(labelId: string) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL capabilities
    const rawClient = this.linearClient.getRawClient();
    return rawClient.issues({
      filter: {
        labels: { id: { eq: labelId } }
      } as any
    });
  }

  /**
   * Gets all issues related to a specific issue.
   *
   * @param issueId - ID of the issue
   * @returns Promise resolving to an array of related issues
   */
  async getRelatedIssues(issueId: string) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL capabilities
    const rawClient = this.linearClient.getRawClient();
    return rawClient.issues({
      filter: {
        // GraphQL API supports relation filtering but it's not fully typed in the SDK
        relations: {
          type: {
            // Relationship types: blocks, blocked_by, related_to, duplicate, duplicated_by
            in: ["blocks", "blocked_by", "related_to", "duplicate", "duplicated_by"]
          },
          issue: { id: { eq: issueId } }
        }
      } as any
    });
  }

  /**
   * Gets all issues blocking a specific issue.
   *
   * @param issueId - ID of the issue
   * @returns Promise resolving to an array of blocking issues
   */
  async getBlockingIssues(issueId: string) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL capabilities
    const rawClient = this.linearClient.getRawClient();
    return rawClient.issues({
      filter: {
        relations: {
          type: { eq: "blocks" },
          issue: { id: { eq: issueId } }
        }
      } as any
    });
  }

  /**
   * Gets all issues blocked by a specific issue.
   *
   * @param issueId - ID of the issue
   * @returns Promise resolving to an array of blocked issues
   */
  async getBlockedIssues(issueId: string) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL capabilities
    const rawClient = this.linearClient.getRawClient();
    return rawClient.issues({
      filter: {
        relations: {
          type: { eq: "blocked_by" },
          issue: { id: { eq: issueId } }
        }
      } as any
    });
  }

  /**
   * Gets all projects for a team.
   *
   * @param teamId - ID of the team
   * @returns Promise resolving to an array of projects
   */
  async getProjectsForTeam(teamId: string) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL capabilities
    const rawClient = this.linearClient.getRawClient();
    return rawClient.projects({
      filter: {
        team: { id: { eq: teamId } }
      } as any
    });
  }

  /**
   * Gets all projects for an initiative.
   *
   * @param initiativeId - ID of the initiative
   * @returns Promise resolving to an array of projects
   */
  async getProjectsForInitiative(initiativeId: string) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL capabilities
    const rawClient = this.linearClient.getRawClient();
    return rawClient.projects({
      filter: {
        initiative: { id: { eq: initiativeId } }
      } as any
    });
  }

  /**
   * Links two issues with a specific relationship type.
   *
   * @param issueId - ID of the first issue
   * @param relatedIssueId - ID of the second issue
   * @param relationType - Type of relationship
   * @returns Promise resolving to the created relationship
   */
  async linkIssues(
    issueId: string,
    relatedIssueId: string,
    relationType: "blocks" | "blocked_by" | "related_to" | "duplicate" | "duplicated_by"
  ) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL mutations
    const rawClient = this.linearClient.getRawClient();
    // @ts-ignore - issueRelationCreate is available in the GraphQL API but not fully typed
    return rawClient.issueRelationCreate({
      issueId,
      relatedIssueId,
      type: relationType
    });
  }

  /**
   * Unlinks two issues.
   *
   * @param issueRelationId - ID of the issue relation to remove
   * @returns Promise resolving when the relation is deleted
   */
  async unlinkIssues(issueRelationId: string) {
    // @ts-ignore - The Linear SDK types don't fully expose all GraphQL mutations
    const rawClient = this.linearClient.getRawClient();
    // @ts-ignore - issueRelationDelete is available in the GraphQL API but not fully typed
    return rawClient.issueRelationDelete({
      id: issueRelationId
    });
  }

  /**
   * Gets all issues assigned to a specific user.
   *
   * @param userId - ID of the user
   * @param includeArchived - Whether to include archived issues (default: false)
   * @param teamId - Optionally filter by team ID
   * @returns Promise resolving to an array of issues
   */
  async getIssuesAssignedToUser(userId: string, includeArchived = false, teamId?: string) {
    // Using a more direct method to get assigned issues
    // Added teamId as an optional parameter to filter by team
    return this.linearClient.getIssuesAssignedToUser(userId, {
      includeArchived,
      teamId,
      first: 100 // Increase the limit to ensure we get all assignments
    });
  }

  /**
   * Assigns an issue to a user.
   *
   * @param issueId - ID of the issue
   * @param userId - ID of the user to assign
   * @returns Promise resolving when the issue is assigned
   */
  async assignIssueToUser(issueId: string, userId: string) {
    return this.linearClient.updateIssue(issueId, {
      assigneeId: userId
    });
  }

  /**
   * Unassigns a user from an issue.
   *
   * @param issueId - ID of the issue
   * @returns Promise resolving when the issue is unassigned
   */
  async unassignIssue(issueId: string) {
    return this.linearClient.updateIssue(issueId, {
      assigneeId: undefined // Using undefined instead of null to match the expected type
    });
  }
}
