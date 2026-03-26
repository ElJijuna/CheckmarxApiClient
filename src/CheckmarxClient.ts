import { Security } from './security/Security';
import { ProjectResource, type RequestFn, type RequestBufferFn } from './resources/ProjectResource';
import { CheckmarxApiError } from './errors/CheckmarxApiError';
import type { CheckmarxProject, ProjectsParams } from './domain/Project';
import type { CheckmarxScan, ScansParams } from './domain/Scan';
import type { CheckmarxScanSummary, ScanSummaryParams } from './domain/ScanSummary';
import type { CheckmarxReportRequest, CheckmarxReportResponse } from './domain/Report';
import type { CheckmarxProjectsOverviewResponse, ProjectsOverviewParams } from './domain/ProjectsOverview';
import type { CheckmarxAuthResponse } from './domain/Auth';

/**
 * Payload emitted on every HTTP request made by {@link CheckmarxClient}.
 */
export interface RequestEvent {
  /** Full URL that was requested */
  url: string;
  /** HTTP method used */
  method: 'GET' | 'POST';
  /** Timestamp when the request started */
  startedAt: Date;
  /** Timestamp when the request finished (success or error) */
  finishedAt: Date;
  /** Total duration in milliseconds */
  durationMs: number;
  /** HTTP status code returned by the server, if a response was received */
  statusCode?: number;
  /** Error thrown, if the request failed */
  error?: Error;
}

/** Map of supported client events to their callback signatures */
export interface CheckmarxClientEvents {
  request: (event: RequestEvent) => void;
}

/**
 * Constructor options for {@link CheckmarxClient}.
 */
export interface CheckmarxClientOptions {
  /** The host URL of the Checkmarx On-Premise instance (e.g., `https://checkmarx.example.com`) */
  apiUrl: string;
  /** The API path to prepend to every request (e.g., `'api'`) */
  apiPath: string;
  /** The bearer token to authenticate with */
  token: string;
}

/**
 * Main entry point for the Checkmarx On-Premise REST API client.
 *
 * @example
 * ```typescript
 * const cxClient = new CheckmarxClient({
 *   apiUrl: 'https://checkmarx.example.com',
 *   apiPath: 'api',
 *   token: 'my-bearer-token',
 * });
 *
 * const projects      = await cxClient.projects({ limit: 50 });
 * const project       = await cxClient.project('project-id');
 * const branches      = await cxClient.project('project-id').branches();
 * const scans         = await cxClient.scans({ 'project-id': 'project-id' });
 * const summary       = await cxClient.scanSummary({ 'scan-ids': 'scan-id' });
 * const report        = await cxClient.createReport({ fileFormat: 'PDF', data: { scanId: 'scan-id' } });
 * const file          = await cxClient.downloadReport('report-id');
 * const overview      = await cxClient.projectsOverview();
 * ```
 */
export class CheckmarxClient {
  private readonly security: Security;
  private readonly apiPath: string;
  private readonly refreshToken: string;
  private readonly listeners: Map<keyof CheckmarxClientEvents, CheckmarxClientEvents[keyof CheckmarxClientEvents][]> = new Map();

  /**
   * @param options - Connection and authentication options
   * @throws {TypeError} If `apiUrl` is not a valid URL
   */
  constructor({ apiUrl, apiPath, token }: CheckmarxClientOptions) {
    this.security = new Security(apiUrl, token);
    this.apiPath = apiPath.replace(/^\/|\/$/g, '');
    this.refreshToken = token;
  }

  /**
   * Subscribes to a client event.
   *
   * @example
   * ```typescript
   * cxClient.on('request', (event) => {
   *   console.log(`${event.method} ${event.url} — ${event.durationMs}ms`);
   *   if (event.error) console.error('Request failed:', event.error);
   * });
   * ```
   */
  on<K extends keyof CheckmarxClientEvents>(event: K, callback: CheckmarxClientEvents[K]): this {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
    return this;
  }

  private emit<K extends keyof CheckmarxClientEvents>(
    event: K,
    payload: Parameters<CheckmarxClientEvents[K]>[0],
  ): void {
    const callbacks = this.listeners.get(event) ?? [];
    for (const cb of callbacks) {
      (cb as (p: typeof payload) => void)(payload);
    }
  }

  /**
   * Performs an authenticated GET request to the Checkmarx REST API.
   *
   * @param path - API path appended directly to `apiUrl` (e.g., `'/projects'`)
   * @param params - Optional query parameters to append to the URL
   * @throws {CheckmarxApiError} If the HTTP response is not OK
   * @internal
   */
  private async request<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const base = `${this.security.getApiUrl()}/${this.apiPath}${path}`;
    const url = buildUrl(base, params);
    const startedAt = new Date();
    let statusCode: number | undefined;
    try {
      const response = await fetch(url, { headers: this.security.getHeaders() });
      statusCode = response.status;
      if (!response.ok) {
        throw new CheckmarxApiError(response.status, response.statusText);
      }
      const data = await response.json() as T;
      this.emit('request', { url, method: 'GET', startedAt, finishedAt: new Date(), durationMs: Date.now() - startedAt.getTime(), statusCode });
      return data;
    } catch (err) {
      const finishedAt = new Date();
      this.emit('request', { url, method: 'GET', startedAt, finishedAt, durationMs: finishedAt.getTime() - startedAt.getTime(), statusCode, error: err instanceof Error ? err : new Error(String(err)) });
      throw err;
    }
  }

  private async requestPost<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.security.getApiUrl()}/${this.apiPath}${path}`;
    const startedAt = new Date();
    let statusCode: number | undefined;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.security.getHeaders(),
        body: JSON.stringify(body),
      });
      statusCode = response.status;
      if (!response.ok) {
        throw new CheckmarxApiError(response.status, response.statusText);
      }
      const data = await response.json() as T;
      this.emit('request', { url, method: 'POST', startedAt, finishedAt: new Date(), durationMs: Date.now() - startedAt.getTime(), statusCode });
      return data;
    } catch (err) {
      const finishedAt = new Date();
      this.emit('request', { url, method: 'POST', startedAt, finishedAt, durationMs: finishedAt.getTime() - startedAt.getTime(), statusCode, error: err instanceof Error ? err : new Error(String(err)) });
      throw err;
    }
  }

  private async requestFormPost<T>(url: string, body: URLSearchParams): Promise<T> {
    const startedAt = new Date();
    let statusCode: number | undefined;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      statusCode = response.status;
      if (!response.ok) {
        throw new CheckmarxApiError(response.status, response.statusText);
      }
      const data = await response.json() as T;
      this.emit('request', { url, method: 'POST', startedAt, finishedAt: new Date(), durationMs: Date.now() - startedAt.getTime(), statusCode });
      return data;
    } catch (err) {
      const finishedAt = new Date();
      this.emit('request', { url, method: 'POST', startedAt, finishedAt, durationMs: finishedAt.getTime() - startedAt.getTime(), statusCode, error: err instanceof Error ? err : new Error(String(err)) });
      throw err;
    }
  }

  private async requestBuffer(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<ArrayBuffer> {
    const base = `${this.security.getApiUrl()}/${this.apiPath}${path}`;
    const url = buildUrl(base, params);
    const startedAt = new Date();
    let statusCode: number | undefined;
    try {
      const response = await fetch(url, { headers: this.security.getHeaders() });
      statusCode = response.status;
      if (!response.ok) {
        throw new CheckmarxApiError(response.status, response.statusText);
      }
      const data = await response.arrayBuffer();
      this.emit('request', { url, method: 'GET', startedAt, finishedAt: new Date(), durationMs: Date.now() - startedAt.getTime(), statusCode });
      return data;
    } catch (err) {
      const finishedAt = new Date();
      this.emit('request', { url, method: 'GET', startedAt, finishedAt, durationMs: finishedAt.getTime() - startedAt.getTime(), statusCode, error: err instanceof Error ? err : new Error(String(err)) });
      throw err;
    }
  }

  /**
   * Fetches all projects accessible to the authenticated user.
   *
   * `GET /api/projects`
   *
   * @param params - Optional filters: `limit`, `offset`, `name`, `ids`, `tags`
   * @returns An object containing projects and pagination counts
   */
  async projects(params?: ProjectsParams): Promise<{ projects: CheckmarxProject[]; filteredTotalCount: number; totalCount: number }> {
    return this.request<{ projects: CheckmarxProject[]; filteredTotalCount: number; totalCount: number }>(
      '/projects',
      params as Record<string, string | number | boolean>,
    );
  }

  /**
   * Returns a {@link ProjectResource} for a given project ID, providing access
   * to project-level data and sub-resources.
   *
   * The returned resource can be awaited directly to fetch project info,
   * or chained to access nested resources.
   *
   * @param projectId - The project ID
   * @returns A chainable project resource
   *
   * @example
   * ```typescript
   * const project  = await cxClient.project('project-id');
   * const branches = await cxClient.project('project-id').branches({ branchName: 'main' });
   * ```
   */
  project(projectId: string): ProjectResource {
    const request: RequestFn = <T>(
      path: string,
      params?: Record<string, string | number | boolean>,
    ) => this.request<T>(path, params);
    const requestBuffer: RequestBufferFn = (path, params) => this.requestBuffer(path, params);
    return new ProjectResource(request, requestBuffer, projectId);
  }

  /**
   * Fetches all scans accessible to the authenticated user.
   *
   * `GET /api/scans`
   *
   * @param params - Optional filters: `project-id`, `project-name`, `branch`, `status`, `tags`, `limit`, `offset`, `from-date`, `to-date`
   * @returns An object containing scans and pagination counts
   */
  async scans(params?: ScansParams): Promise<{ scans: CheckmarxScan[]; filteredTotalCount: number; totalCount: number }> {
    return this.request<{ scans: CheckmarxScan[]; filteredTotalCount: number; totalCount: number }>(
      '/scans',
      params as Record<string, string | number | boolean>,
    );
  }

  /**
   * Fetches a scan summary for the given scan IDs.
   *
   * `GET /api/scan-summary`
   *
   * @param params - Optional filters: `scan-ids`, `include-queries`, `include-status-counters`
   * @returns An array of scan summaries
   */
  async scanSummary(params?: ScanSummaryParams): Promise<CheckmarxScanSummary[]> {
    return this.request<CheckmarxScanSummary[]>(
      '/scan-summary',
      params as Record<string, string | number | boolean>,
    );
  }

  /**
   * Creates a new report generation request.
   *
   * `POST /api/reports/v2`
   *
   * @param body - The report request payload
   * @returns The report response containing the report ID
   */
  async createReport(body: CheckmarxReportRequest): Promise<CheckmarxReportResponse> {
    return this.requestPost<CheckmarxReportResponse>('/reports/v2', body);
  }

  /**
   * Downloads a generated report as a binary ArrayBuffer.
   *
   * `GET /api/reports/{reportId}`
   *
   * @param reportId - The report ID to download
   * @returns The report content as an ArrayBuffer
   */
  async downloadReport(reportId: string): Promise<ArrayBuffer> {
    return this.requestBuffer(`/reports/${reportId}`);
  }

  /**
   * Authenticates against the Checkmarx identity endpoint using the refresh token
   * provided at construction time, and updates the client's Authorization header
   * with the returned access token for all subsequent requests.
   *
   * `POST <authApiPath>`
   *
   * @param authApiPath - Path to the auth endpoint, relative to `apiUrl`.
   *   Overrides the default `apiPath` since the auth endpoint lives outside the main API path.
   *   Example: `'auth/realms/CxOne/protocol/openid-connect/token'`
   * @returns The auth response containing `token_type` and `access_token`
   *
   * @example
   * ```typescript
   * await cxClient.authenticate('auth/realms/CxOne/protocol/openid-connect/token');
   * // All subsequent calls now use the new access token automatically
   * const projects = await cxClient.projects();
   * ```
   */
  async authenticate(authApiPath: string): Promise<CheckmarxAuthResponse> {
    const path = authApiPath.replace(/^\/|\/$/g, '');
    const url = `${this.security.getApiUrl()}/${path}`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: 'ast-app',
      refresh_token: this.refreshToken,
    });
    const result = await this.requestFormPost<CheckmarxAuthResponse>(url, body);
    this.security.updateToken(result.token_type, result.access_token);
    return result;
  }

  /**
   * Fetches the projects overview.
   *
   * `GET /api/projects-overview`
   *
   * @param params - Optional filters: `limit`, `offset`, `project-ids`, `tags`, `branch-name`
   * @returns An object containing projects overview items and pagination counts
   */
  async projectsOverview(params?: ProjectsOverviewParams): Promise<CheckmarxProjectsOverviewResponse> {
    return this.request<CheckmarxProjectsOverviewResponse>(
      '/projects-overview',
      params as Record<string, string | number | boolean>,
    );
  }
}

/**
 * Appends query parameters to a URL string, skipping `undefined` values.
 * @internal
 */
function buildUrl(base: string, params?: Record<string, string | number | boolean>): string {
  if (!params) return base;
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return base;
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `${base}?${search.toString()}`;
}
