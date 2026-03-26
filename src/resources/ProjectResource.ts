import type { CheckmarxProject } from '../domain/Project';
import type { CheckmarxBranch, BranchesParams } from '../domain/Branch';

/** @internal */
export type RequestFn = <T>(
  path: string,
  params?: Record<string, string | number | boolean>,
) => Promise<T>;

/** @internal */
export type RequestBufferFn = (
  path: string,
  params?: Record<string, string | number | boolean>,
) => Promise<ArrayBuffer>;

/** @internal */
export type RequestBodyFn = <T>(path: string, body: unknown) => Promise<T>;

/**
 * Represents a Checkmarx project resource with chainable async methods.
 *
 * Implements `PromiseLike<CheckmarxProject>` so it can be awaited directly
 * to fetch the project info, while also exposing sub-resource methods.
 *
 * @example
 * ```typescript
 * // Await directly to get project info
 * const project = await cxClient.project('project-id');
 *
 * // Get branches with filters
 * const branches = await cxClient.project('project-id').branches({ branchName: 'main' });
 * ```
 */
export class ProjectResource implements PromiseLike<CheckmarxProject> {
  /** @internal */
  constructor(
    private readonly request: RequestFn,
    private readonly requestBuffer: RequestBufferFn,
    private readonly projectId: string,
  ) {}

  /**
   * Allows the resource to be awaited directly, resolving with the project info.
   * Delegates to {@link ProjectResource.get}.
   */
  then<TResult1 = CheckmarxProject, TResult2 = never>(
    onfulfilled?: ((value: CheckmarxProject) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.get().then(onfulfilled, onrejected);
  }

  /**
   * Fetches the project details.
   *
   * `GET /api/projects/{projectId}`
   *
   * @returns The project object
   */
  async get(): Promise<CheckmarxProject> {
    return this.request<CheckmarxProject>(`/projects/${this.projectId}`);
  }

  /**
   * Fetches branches belonging to this project.
   *
   * `GET /api/projects/{projectId}/branches`
   *
   * @param params - Optional filters: `limit`, `offset`, `branchName`
   * @returns An array of branches
   */
  async branches(params?: BranchesParams): Promise<CheckmarxBranch[]> {
    return this.request<CheckmarxBranch[]>(
      `/projects/${this.projectId}/branches`,
      params as Record<string, string | number | boolean>,
    );
  }
}
