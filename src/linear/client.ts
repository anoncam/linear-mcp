import { LinearClient as OriginalLinearClient } from "@linear/sdk";

/**
 * Extended Linear client that provides additional utility methods and
 * handles common operations for the MCP server.
 */
export class LinearClient {
  private client: OriginalLinearClient;

  constructor(apiKey: string) {
    this.client = new OriginalLinearClient({ apiKey });
  }

  /**
   * Gets the raw Linear client instance.
   */
  getRawClient(): OriginalLinearClient {
    return this.client;
  }

  // ================= Issues =================

  /**
   * Get an issue by ID
   */
  async getIssue(id: string) {
    return this.client.issue(id);
  }

  /**
   * List issues with pagination and filtering
   */
  async listIssues(options: {
    first?: number;
    after?: string;
    teamIds?: string[];
    states?: string[];
  } = {}) {
    const { first = 50, after, teamIds, states } = options;
    
    // Create filter based on provided criteria
    const filter: Record<string, any> = {};
    
    if (teamIds && teamIds.length > 0) {
      filter.team = { id: { in: teamIds } };
    }
    
    if (states && states.length > 0) {
      filter.state = { id: { in: states } };
    }
    
    return this.client.issues({
      first,
      after,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
  }

  /**
   * Search issues with a text query
   */
  async searchIssues(query: string, options: {
    first?: number;
    after?: string;
  } = {}) {
    const { first = 50, after } = options;
    
    // Use the raw GraphQL API to perform a search since the SDK doesn't expose a direct search method
    const rawClient = this.client;
    
    // Use the issues method with a filter on title and description
    return rawClient.issues({
      first,
      after,
      filter: {
        or: [
          { title: { containsIgnoreCase: query } },
          { description: { containsIgnoreCase: query } }
        ]
      }
    });
  }

  /**
   * Create a new issue
   */
  async createIssue(data: {
    title: string;
    description?: string;
    teamId: string;
    stateId?: string;
    assigneeId?: string;
    priority?: number;
    labelIds?: string[];
    dueDate?: string;
  }) {
    return this.client.createIssue(data);
  }

  /**
   * Update an existing issue
   */
  async updateIssue(
    id: string,
    data: {
      title?: string;
      description?: string;
      stateId?: string;
      assigneeId?: string;
      priority?: number;
      labelIds?: string[];
      dueDate?: string;
    }
  ) {
    return this.client.updateIssue(id, data);
  }

  // ================= Teams =================

  /**
   * Get a team by ID
   */
  async getTeam(id: string) {
    return this.client.team(id);
  }

  /**
   * List all teams
   */
  async listTeams(options: {
    first?: number;
    after?: string;
  } = {}) {
    const { first = 50, after } = options;
    
    return this.client.teams({
      first,
      after,
    });
  }

  // ================= Projects =================

  /**
   * Get a project by ID
   */
  async getProject(id: string) {
    return this.client.project(id);
  }

  /**
   * List projects with pagination and filtering
   */
  async listProjects(options: {
    first?: number;
    after?: string;
    teamIds?: string[];
    states?: string[];
  } = {}) {
    const { first = 50, after, teamIds, states } = options;
    
    // Create filter based on provided criteria
    const filter: Record<string, any> = {};
    
    if (teamIds && teamIds.length > 0) {
      filter.team = { id: { in: teamIds } };
    }
    
    if (states && states.length > 0) {
      filter.state = { id: { in: states } };
    }
    
    return this.client.projects({
      first,
      after,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
  }

  // ================= Users =================

  /**
   * Get a user by ID
   */
  async getUser(id: string) {
    return this.client.user(id);
  }

  /**
   * List all users
   */
  async listUsers(options: {
    first?: number;
    after?: string;
  } = {}) {
    const { first = 50, after } = options;
    
    return this.client.users({
      first,
      after,
    });
  }

  // ================= Workflow States =================

  /**
   * Get a workflow state by ID
   */
  async getWorkflowState(id: string) {
    return this.client.workflowState(id);
  }

  /**
   * List workflow states by team
   */
  async listWorkflowStates(teamId: string, options: {
    first?: number;
    after?: string;
  } = {}) {
    const { first = 50, after } = options;
    
    return this.client.workflowStates({
      first,
      after,
      filter: {
        team: { id: { eq: teamId } },
      },
    });
  }

  // ================= Labels =================

  /**
   * Get a label by ID
   */
  async getLabel(id: string) {
    return this.client.issueLabel(id);
  }

  /**
   * List labels with pagination and filtering
   */
  async listLabels(options: {
    first?: number;
    after?: string;
    teamId?: string;
  } = {}) {
    const { first = 50, after, teamId } = options;
    
    // Create filter based on provided criteria
    const filter: Record<string, any> = {};
    
    if (teamId) {
      filter.team = { id: { eq: teamId } };
    }
    
    return this.client.issueLabels({
      first,
      after,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
  }

  // ================= Comments =================

  /**
   * Get a comment by ID
   */
  async getComment(id: string) {
    return this.client.comment(id);
  }

  /**
   * List comments for an issue
   */
  async listComments(issueId: string, options: {
    first?: number;
    after?: string;
  } = {}) {
    const { first = 50, after } = options;
    
    return this.client.comments({
      first,
      after,
      filter: {
        issue: { id: { eq: issueId } },
      },
    });
  }

  /**
   * Create a comment
   */
  async createComment(data: {
    issueId: string;
    body: string;
  }) {
    return this.client.createComment(data);
  }

  /**
   * Update a comment
   */
  async updateComment(id: string, data: {
    body: string;
  }) {
    return this.client.updateComment(id, data);
  }

  /**
   * Delete a comment
   */
  async deleteComment(id: string) {
    return this.client.deleteComment(id);
  }

  // ================= Cycles =================

  /**
   * Get a cycle by ID
   */
  async getCycle(id: string) {
    return this.client.cycle(id);
  }

  /**
   * List cycles for a team
   */
  async listCycles(teamId: string, options: {
    first?: number;
    after?: string;
  } = {}) {
    const { first = 50, after } = options;
    
    return this.client.cycles({
      first,
      after,
      filter: {
        team: { id: { eq: teamId } },
      },
    });
  }

  /**
   * Create a cycle
   */
  async createCycle(data: {
    teamId: string;
    name: string;
    startsAt: Date;
    endsAt: Date;
    description?: string;
  }) {
    return this.client.createCycle(data);
  }

  /**
   * Update a cycle
   */
  async updateCycle(id: string, data: {
    name?: string;
    startsAt?: Date;
    endsAt?: Date;
    description?: string;
  }) {
    return this.client.updateCycle(id, data);
  }

  /**
   * List active cycles across all teams
   */
  async listActiveCycles(options: {
    first?: number;
    after?: string;
  } = {}) {
    const { first = 50, after } = options;
    const now = new Date().toISOString();
    
    return this.client.cycles({
      first,
      after,
      filter: {
        // @ts-ignore - The Linear SDK types may not be up to date
        startsAt: { lte: now },
        // @ts-ignore - The Linear SDK types may not be up to date
        endsAt: { gte: now }
      },
    });
  }

  // ================= Reactions =================

  /**
   * Create a reaction
   */
  async createReaction(data: {
    commentId: string;
    emoji: string;
  }) {
    return this.client.createReaction(data);
  }
}
