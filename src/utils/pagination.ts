/**
 * Utilities for handling pagination when working with the Linear API.
 */

/**
 * A generic interface representing a paginated response from Linear.
 */
export interface PaginatedResult<T> {
  nodes: T[];
  pageInfo?: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

/**
 * Options for pagination.
 */
export interface PaginationOptions {
  /**
   * Number of items to fetch per page.
   */
  first?: number;

  /**
   * Cursor to continue from a previous page.
   */
  after?: string;
}

/**
 * Generic type for a function that fetches a page of results.
 */
export type PageFetcher<T> = (options: PaginationOptions) => Promise<PaginatedResult<T>>;

/**
 * Fetches all pages of results from a paginated API.
 *
 * @param fetchPage - Function that fetches a page of results
 * @param options - Initial pagination options
 * @returns A promise that resolves to an array of all items
 */
export async function fetchAllPages<T>(
  fetchPage: PageFetcher<T>,
  options: PaginationOptions = { first: 50 }
): Promise<T[]> {
  let allNodes: T[] = [];
  let hasNextPage = true;
  let after: string | undefined = options.after;
  const first = options.first || 50;

  while (hasNextPage) {
    const result = await fetchPage({ first, after });
    allNodes = [...allNodes, ...result.nodes];

    // If no pageInfo, or no hasNextPage flag, or no endCursor, we're done
    if (!result.pageInfo || !result.pageInfo.hasNextPage || !result.pageInfo.endCursor) {
      hasNextPage = false;
    } else {
      after = result.pageInfo.endCursor;
    }

    // Safety check - if we got fewer items than requested, we're at the end
    if (result.nodes.length < first) {
      hasNextPage = false;
    }
  }

  return allNodes;
}

/**
 * A paginator that helps with traversing multiple pages of a paginated API.
 */
export class Paginator<T> {
  private fetchPage: PageFetcher<T>;
  private first: number;
  private currentCursor?: string;
  private hasMore: boolean;

  /**
   * Creates a new Paginator.
   *
   * @param fetchPage - Function that fetches a page of results
   * @param first - Number of items to fetch per page
   */
  constructor(fetchPage: PageFetcher<T>, first: number = 50) {
    this.fetchPage = fetchPage;
    this.first = first;
    this.hasMore = true;
  }

  /**
   * Fetches the next page of results.
   *
   * @returns A promise that resolves to the next page of results
   */
  async nextPage(): Promise<PaginatedResult<T>> {
    if (!this.hasMore) {
      return { nodes: [] };
    }

    const result = await this.fetchPage({
      first: this.first,
      after: this.currentCursor
    });

    // Update paginator state
    if (!result.pageInfo || !result.pageInfo.hasNextPage || !result.pageInfo.endCursor) {
      this.hasMore = false;
    } else {
      this.currentCursor = result.pageInfo.endCursor;
    }

    // Safety check - if we got fewer items than requested, we're at the end
    if (result.nodes.length < this.first) {
      this.hasMore = false;
    }

    return result;
  }

  /**
   * Checks if there are more pages to fetch.
   *
   * @returns True if there are more pages, false otherwise
   */
  hasNextPage(): boolean {
    return this.hasMore;
  }

  /**
   * Resets the paginator to the beginning.
   */
  reset(): void {
    this.currentCursor = undefined;
    this.hasMore = true;
  }

  /**
   * Fetches all remaining pages and returns all items.
   *
   * @returns A promise that resolves to an array of all remaining items
   */
  async fetchAll(): Promise<T[]> {
    let allNodes: T[] = [];

    while (this.hasMore) {
      const result = await this.nextPage();
      allNodes = [...allNodes, ...result.nodes];
    }

    return allNodes;
  }
}
