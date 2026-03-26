import { CheckmarxClient } from '../src/CheckmarxClient';
import { CheckmarxApiError } from '../src/errors/CheckmarxApiError';
import type { CheckmarxProject } from '../src/domain/Project';
import type { CheckmarxBranch } from '../src/domain/Branch';
import type { CheckmarxScan } from '../src/domain/Scan';
import type { CheckmarxScanSummary } from '../src/domain/ScanSummary';
import type { CheckmarxReportResponse } from '../src/domain/Report';
import type { CheckmarxProjectOverview } from '../src/domain/ProjectsOverview';

const API_URL = 'https://checkmarx.example.com';
const API_PATH = 'api';
const BASE = `${API_URL}/${API_PATH}`;
const TOKEN = 'my-bearer-token';

const mockProject: CheckmarxProject = {
  id: 'project-uuid-1',
  name: 'My Project',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  mainBranch: 'main',
  repoUrl: 'https://github.com/example/repo.git',
  criticality: 3,
};

const mockBranch: CheckmarxBranch = {
  name: 'main',
};

const mockScan: CheckmarxScan = {
  id: 'scan-uuid-1',
  status: 'Completed',
  branch: 'main',
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T01:00:00Z',
  projectId: 'project-uuid-1',
  projectName: 'My Project',
  engines: ['sast'],
};

const mockScanSummary: CheckmarxScanSummary = {
  scanId: 'scan-uuid-1',
  tenantId: 'tenant-1',
  createdAt: '2024-06-01T00:00:00Z',
  sastCounters: {
    totalCounter: 10,
    highCounter: 2,
    mediumCounter: 5,
    lowCounter: 3,
  },
};

const mockReportResponse: CheckmarxReportResponse = {
  reportId: 'report-uuid-1',
};

const mockProjectOverview: CheckmarxProjectOverview = {
  projectId: 'project-uuid-1',
  projectName: 'My Project',
  applications: [],
  enginesData: [],
  groupIds: ['group-1'],
  importedProjName: '',
  isPublic: false,
  isDeployed: true,
  lastScanDate: '2024-06-01T00:00:00Z',
  projectOrigin: 'Github',
  repoId: 0,
  riskLevel: 'HIGH',
  scmRepoId: '',
  sourceOrigin: '',
  sourceType: 'git',
  tags: { EPM: 'abc', PIPELINE: 'PLAT', PROJECT_KEY: 'PROJ' },
  totalCounters: {
    severityCounters: [
      { severity: 'HIGH', counter: 2 },
      { severity: 'MEDIUM', counter: 5 },
    ],
  },
};

describe('CheckmarxClient', () => {
  let client: CheckmarxClient;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new CheckmarxClient({ apiUrl: API_URL, apiPath: API_PATH, token: TOKEN });
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockOk(data: unknown): void {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(data),
    } as Response);
  }

  function mockOkBuffer(buffer: ArrayBuffer): void {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: () => Promise.resolve(buffer),
    } as Response);
  }

  function mockError(status: number, statusText: string): void {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status,
      statusText,
      json: () => Promise.resolve({}),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as Response);
  }

  describe('constructor', () => {
    it('throws TypeError when apiUrl is invalid', () => {
      expect(
        () => new CheckmarxClient({ apiUrl: 'not-a-url', apiPath: API_PATH, token: TOKEN }),
      ).toThrow(TypeError);
    });

    it('throws with a descriptive message for an invalid apiUrl', () => {
      expect(
        () => new CheckmarxClient({ apiUrl: 'not-a-url', apiPath: API_PATH, token: TOKEN }),
      ).toThrow('Invalid apiUrl: "not-a-url" is not a valid URL');
    });

    it('accepts a valid HTTPS URL', () => {
      expect(
        () => new CheckmarxClient({ apiUrl: API_URL, apiPath: API_PATH, token: TOKEN }),
      ).not.toThrow();
    });
  });

  describe('projects()', () => {
    const projectsResponse = { projects: [mockProject], filteredTotalCount: 1, totalCount: 1 };

    it('calls GET /api/projects', async () => {
      mockOk(projectsResponse);
      await client.projects();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/projects`,
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });

    it('returns the projects response', async () => {
      mockOk(projectsResponse);
      expect(await client.projects()).toEqual(projectsResponse);
    });

    it('appends limit and offset as query params', async () => {
      mockOk(projectsResponse);
      await client.projects({ limit: 10, offset: 20 });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects?limit=10&offset=20`);
    });

    it('appends name filter as query param', async () => {
      mockOk(projectsResponse);
      await client.projects({ name: 'my-proj' });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects?name=my-proj`);
    });

    it('appends ids filter as query param', async () => {
      mockOk(projectsResponse);
      await client.projects({ ids: 'uuid-1,uuid-2' });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects?ids=uuid-1%2Cuuid-2`);
    });

    it('ignores undefined filter values', async () => {
      mockOk(projectsResponse);
      await client.projects({ limit: 5, name: undefined });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects?limit=5`);
    });

    it('throws CheckmarxApiError on a non-OK response', async () => {
      mockError(401, 'Unauthorized');
      await expect(client.projects()).rejects.toThrow('Checkmarx API error: 401 Unauthorized');
    });

    it('throws an instance of CheckmarxApiError on a non-OK response', async () => {
      mockError(403, 'Forbidden');
      await expect(client.projects()).rejects.toBeInstanceOf(CheckmarxApiError);
    });

    it('includes the Bearer Authorization header', async () => {
      mockOk(projectsResponse);
      await client.projects();
      const [, options] = fetchMock.mock.calls[0];
      const headers = (options as RequestInit).headers as Record<string, string>;
      expect(headers['Authorization']).toBe(`Bearer ${TOKEN}`);
    });
  });

  describe('project(id)', () => {
    it('resolves to project info when awaited', async () => {
      mockOk(mockProject);
      expect(await client.project('project-uuid-1')).toEqual(mockProject);
    });

    it('calls GET /api/projects/{id} when awaited', async () => {
      mockOk(mockProject);
      await client.project('project-uuid-1');
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/projects/project-uuid-1`, expect.any(Object));
    });

    it('calls GET /api/projects/{id} via .get()', async () => {
      mockOk(mockProject);
      await client.project('project-uuid-1').get();
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/projects/project-uuid-1`, expect.any(Object));
    });

    it('resolves the same result via .get() as when awaited directly', async () => {
      mockOk(mockProject);
      const result = await client.project('project-uuid-1').get();
      expect(result).toEqual(mockProject);
    });

    it('throws CheckmarxApiError on a non-OK response', async () => {
      mockError(404, 'Not Found');
      await expect(client.project('nonexistent')).rejects.toThrow(
        'Checkmarx API error: 404 Not Found',
      );
    });
  });

  describe('project(id).branches()', () => {
    it('calls GET /api/projects/{id}/branches', async () => {
      mockOk([mockBranch]);
      await client.project('project-uuid-1').branches();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/projects/project-uuid-1/branches`,
        expect.any(Object),
      );
    });

    it('returns an array of branches', async () => {
      mockOk([mockBranch]);
      expect(await client.project('project-uuid-1').branches()).toEqual([mockBranch]);
    });

    it('appends branchName filter as query param', async () => {
      mockOk([mockBranch]);
      await client.project('project-uuid-1').branches({ branchName: 'main' });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects/project-uuid-1/branches?branchName=main`);
    });

    it('appends limit and offset as query params', async () => {
      mockOk([mockBranch]);
      await client.project('project-uuid-1').branches({ limit: 10, offset: 0 });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects/project-uuid-1/branches?limit=10&offset=0`);
    });

    it('throws CheckmarxApiError on a non-OK response', async () => {
      mockError(404, 'Not Found');
      await expect(client.project('nonexistent').branches()).rejects.toThrow(
        'Checkmarx API error: 404 Not Found',
      );
    });
  });

  describe('scans()', () => {
    const scansResponse = { scans: [mockScan], filteredTotalCount: 1, totalCount: 1 };

    it('calls GET /api/scans', async () => {
      mockOk(scansResponse);
      await client.scans();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/scans`,
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });

    it('returns the scans response', async () => {
      mockOk(scansResponse);
      expect(await client.scans()).toEqual(scansResponse);
    });

    it('appends project-id filter as query param', async () => {
      mockOk(scansResponse);
      await client.scans({ 'project-id': 'project-uuid-1' });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/scans?project-id=project-uuid-1`);
    });

    it('appends branch filter as query param', async () => {
      mockOk(scansResponse);
      await client.scans({ branch: 'main' });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/scans?branch=main`);
    });

    it('appends status filter as query param', async () => {
      mockOk(scansResponse);
      await client.scans({ status: 'Completed' });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/scans?status=Completed`);
    });

    it('appends limit and offset as query params', async () => {
      mockOk(scansResponse);
      await client.scans({ limit: 20, offset: 40 });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/scans?limit=20&offset=40`);
    });

    it('ignores undefined filter values', async () => {
      mockOk(scansResponse);
      await client.scans({ limit: 5, branch: undefined });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/scans?limit=5`);
    });

    it('throws CheckmarxApiError on a non-OK response', async () => {
      mockError(401, 'Unauthorized');
      await expect(client.scans()).rejects.toThrow('Checkmarx API error: 401 Unauthorized');
    });

    it('throws an instance of CheckmarxApiError on a non-OK response', async () => {
      mockError(500, 'Internal Server Error');
      await expect(client.scans()).rejects.toBeInstanceOf(CheckmarxApiError);
    });
  });

  describe('scanSummary()', () => {
    it('calls GET /api/scan-summary', async () => {
      mockOk([mockScanSummary]);
      await client.scanSummary();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/scan-summary`,
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });

    it('returns an array of scan summaries', async () => {
      mockOk([mockScanSummary]);
      expect(await client.scanSummary()).toEqual([mockScanSummary]);
    });

    it('appends scan-ids filter as query param', async () => {
      mockOk([mockScanSummary]);
      await client.scanSummary({ 'scan-ids': 'scan-uuid-1' });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/scan-summary?scan-ids=scan-uuid-1`);
    });

    it('appends include-queries as query param', async () => {
      mockOk([mockScanSummary]);
      await client.scanSummary({ 'include-queries': true });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/scan-summary?include-queries=true`);
    });

    it('appends include-status-counters as query param', async () => {
      mockOk([mockScanSummary]);
      await client.scanSummary({ 'include-status-counters': true });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/scan-summary?include-status-counters=true`);
    });

    it('throws CheckmarxApiError on a non-OK response', async () => {
      mockError(401, 'Unauthorized');
      await expect(client.scanSummary()).rejects.toThrow('Checkmarx API error: 401 Unauthorized');
    });
  });

  describe('createReport()', () => {
    const reportBody = {
      reportName: 'My Report',
      fileFormat: 'PDF' as const,
      reportType: 'ui',
      data: { projectId: 'project-uuid-1', scanId: 'scan-uuid-1', branchName: 'main' },
    };

    it('calls POST /api/reports/v2', async () => {
      mockOk(mockReportResponse);
      await client.createReport(reportBody);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/reports/v2`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('returns the report response with reportId', async () => {
      mockOk(mockReportResponse);
      expect(await client.createReport(reportBody)).toEqual(mockReportResponse);
    });

    it('sends the request body as JSON', async () => {
      mockOk(mockReportResponse);
      await client.createReport(reportBody);
      const [, options] = fetchMock.mock.calls[0];
      expect((options as RequestInit).body).toBe(JSON.stringify(reportBody));
    });

    it('includes Content-Type application/json header', async () => {
      mockOk(mockReportResponse);
      await client.createReport(reportBody);
      const [, options] = fetchMock.mock.calls[0];
      const headers = (options as RequestInit).headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('throws CheckmarxApiError on a non-OK response', async () => {
      mockError(400, 'Bad Request');
      await expect(client.createReport(reportBody)).rejects.toThrow(
        'Checkmarx API error: 400 Bad Request',
      );
    });

    it('throws an instance of CheckmarxApiError on a non-OK response', async () => {
      mockError(500, 'Internal Server Error');
      await expect(client.createReport(reportBody)).rejects.toBeInstanceOf(CheckmarxApiError);
    });
  });

  describe('downloadReport()', () => {
    it('calls GET /api/reports/{reportId}', async () => {
      mockOkBuffer(new ArrayBuffer(8));
      await client.downloadReport('report-uuid-1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/reports/report-uuid-1`,
        expect.any(Object),
      );
    });

    it('returns an ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(16);
      mockOkBuffer(buffer);
      const result = await client.downloadReport('report-uuid-1');
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(16);
    });

    it('throws CheckmarxApiError on a non-OK response', async () => {
      mockError(404, 'Not Found');
      await expect(client.downloadReport('nonexistent')).rejects.toThrow(
        'Checkmarx API error: 404 Not Found',
      );
    });

    it('throws an instance of CheckmarxApiError on a non-OK response', async () => {
      mockError(403, 'Forbidden');
      await expect(client.downloadReport('report-uuid-1')).rejects.toBeInstanceOf(CheckmarxApiError);
    });
  });

  describe('projectsOverview()', () => {
    const overviewResponse = {
      projects: [mockProjectOverview],
    };

    it('calls GET /api/projects-overview', async () => {
      mockOk(overviewResponse);
      await client.projectsOverview();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE}/projects-overview`,
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });

    it('returns the projects overview response', async () => {
      mockOk(overviewResponse);
      expect(await client.projectsOverview()).toEqual(overviewResponse);
    });

    it('appends project-ids filter as query param', async () => {
      mockOk(overviewResponse);
      await client.projectsOverview({ 'project-ids': 'uuid-1,uuid-2' });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects-overview?project-ids=uuid-1%2Cuuid-2`);
    });

    it('appends branch-name filter as query param', async () => {
      mockOk(overviewResponse);
      await client.projectsOverview({ 'branch-name': 'main' });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects-overview?branch-name=main`);
    });

    it('appends limit and offset as query params', async () => {
      mockOk(overviewResponse);
      await client.projectsOverview({ limit: 10, offset: 0 });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects-overview?limit=10&offset=0`);
    });

    it('ignores undefined filter values', async () => {
      mockOk(overviewResponse);
      await client.projectsOverview({ limit: 5, tags: undefined });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${BASE}/projects-overview?limit=5`);
    });

    it('throws CheckmarxApiError on a non-OK response', async () => {
      mockError(401, 'Unauthorized');
      await expect(client.projectsOverview()).rejects.toThrow(
        'Checkmarx API error: 401 Unauthorized',
      );
    });

    it('throws an instance of CheckmarxApiError on a non-OK response', async () => {
      mockError(403, 'Forbidden');
      await expect(client.projectsOverview()).rejects.toBeInstanceOf(CheckmarxApiError);
    });
  });

  describe('on("request", ...) event emission', () => {
    it('emits a request event after a successful GET', async () => {
      const projectsResponse = { projects: [mockProject], filteredTotalCount: 1, totalCount: 1 };
      mockOk(projectsResponse);
      const events: unknown[] = [];
      client.on('request', (event) => events.push(event));
      await client.projects();
      expect(events).toHaveLength(1);
    });

    it('emits a request event with the correct URL', async () => {
      const projectsResponse = { projects: [mockProject], filteredTotalCount: 1, totalCount: 1 };
      mockOk(projectsResponse);
      const events: { url: string }[] = [];
      client.on('request', (event) => events.push(event));
      await client.projects();
      expect(events[0].url).toBe(`${BASE}/projects`);
    });

    it('emits a request event with method GET', async () => {
      const projectsResponse = { projects: [mockProject], filteredTotalCount: 1, totalCount: 1 };
      mockOk(projectsResponse);
      const events: { method: string }[] = [];
      client.on('request', (event) => events.push(event));
      await client.projects();
      expect(events[0].method).toBe('GET');
    });

    it('emits a request event with method POST for createReport', async () => {
      mockOk(mockReportResponse);
      const events: { method: string }[] = [];
      client.on('request', (event) => events.push(event));
      await client.createReport({ fileFormat: 'PDF' });
      expect(events[0].method).toBe('POST');
    });

    it('emits a request event with statusCode on success', async () => {
      const projectsResponse = { projects: [mockProject], filteredTotalCount: 1, totalCount: 1 };
      mockOk(projectsResponse);
      const events: { statusCode?: number }[] = [];
      client.on('request', (event) => events.push(event));
      await client.projects();
      expect(events[0].statusCode).toBe(200);
    });

    it('emits a request event with an error on failure', async () => {
      mockError(500, 'Internal Server Error');
      const events: { error?: Error }[] = [];
      client.on('request', (event) => events.push(event));
      await client.projects().catch(() => {});
      expect(events[0].error).toBeInstanceOf(CheckmarxApiError);
    });

    it('emits a request event with durationMs on success', async () => {
      const projectsResponse = { projects: [mockProject], filteredTotalCount: 1, totalCount: 1 };
      mockOk(projectsResponse);
      const events: { durationMs: number }[] = [];
      client.on('request', (event) => events.push(event));
      await client.projects();
      expect(typeof events[0].durationMs).toBe('number');
      expect(events[0].durationMs).toBeGreaterThanOrEqual(0);
    });

    it('emits a request event with startedAt and finishedAt dates', async () => {
      const projectsResponse = { projects: [mockProject], filteredTotalCount: 1, totalCount: 1 };
      mockOk(projectsResponse);
      const events: { startedAt: Date; finishedAt: Date }[] = [];
      client.on('request', (event) => events.push(event));
      await client.projects();
      expect(events[0].startedAt).toBeInstanceOf(Date);
      expect(events[0].finishedAt).toBeInstanceOf(Date);
    });

    it('supports multiple listeners on the same event', async () => {
      const projectsResponse = { projects: [mockProject], filteredTotalCount: 1, totalCount: 1 };
      mockOk(projectsResponse);
      let count = 0;
      client.on('request', () => count++);
      client.on('request', () => count++);
      await client.projects();
      expect(count).toBe(2);
    });

    it('returns the client instance from on() for chaining', () => {
      const result = client.on('request', () => {});
      expect(result).toBe(client);
    });
  });

  describe('authenticate()', () => {
    const AUTH_PATH = 'auth/realms/CxOne/protocol/openid-connect/token';
    const AUTH_URL = `${API_URL}/${AUTH_PATH}`;
    const mockAuthResponse = { token_type: 'Bearer', access_token: 'new-access-token' };

    it('calls POST to the overridden auth URL', async () => {
      mockOk(mockAuthResponse);
      await client.authenticate(AUTH_PATH);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(AUTH_URL);
      expect((init as RequestInit).method).toBe('POST');
    });

    it('sends Content-Type application/x-www-form-urlencoded', async () => {
      mockOk(mockAuthResponse);
      await client.authenticate(AUTH_PATH);
      const [, init] = fetchMock.mock.calls[0];
      expect((init as RequestInit).headers).toEqual(
        expect.objectContaining({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      );
    });

    it('does not send an Authorization header in the auth request', async () => {
      mockOk(mockAuthResponse);
      await client.authenticate(AUTH_PATH);
      const [, init] = fetchMock.mock.calls[0];
      expect((init as RequestInit).headers).not.toHaveProperty('Authorization');
    });

    it('sends grant_type, client_id and refresh_token in the body', async () => {
      mockOk(mockAuthResponse);
      await client.authenticate(AUTH_PATH);
      const [, init] = fetchMock.mock.calls[0];
      const body = init?.body as URLSearchParams;
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('client_id')).toBe('ast-app');
      expect(body.get('refresh_token')).toBe(TOKEN);
    });

    it('returns token_type and access_token', async () => {
      mockOk(mockAuthResponse);
      const result = await client.authenticate(AUTH_PATH);
      expect(result).toEqual(mockAuthResponse);
    });

    it('updates the Authorization header for subsequent requests', async () => {
      mockOk(mockAuthResponse);
      await client.authenticate(AUTH_PATH);

      const projectsResponse = { projects: [], filteredTotalCount: 0, totalCount: 0 };
      mockOk(projectsResponse);
      await client.projects();

      const [, init] = fetchMock.mock.calls[1];
      expect(((init as RequestInit).headers as Record<string, string>)['Authorization']).toBe(
        'Bearer new-access-token',
      );
    });

    it('strips leading and trailing slashes from authApiPath', async () => {
      mockOk(mockAuthResponse);
      await client.authenticate(`/${AUTH_PATH}/`);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(AUTH_URL);
    });

    it('emits a request event with method POST', async () => {
      mockOk(mockAuthResponse);
      const events: { method: string }[] = [];
      client.on('request', (e) => events.push(e));
      await client.authenticate(AUTH_PATH);
      expect(events[0].method).toBe('POST');
    });

    it('emits a request event with the auth URL', async () => {
      mockOk(mockAuthResponse);
      const events: { url: string }[] = [];
      client.on('request', (e) => events.push(e));
      await client.authenticate(AUTH_PATH);
      expect(events[0].url).toBe(AUTH_URL);
    });

    it('throws CheckmarxApiError on a non-OK response', async () => {
      mockError(401, 'Unauthorized');
      await expect(client.authenticate(AUTH_PATH)).rejects.toThrow(
        'Checkmarx API error: 401 Unauthorized',
      );
    });

    it('throws an instance of CheckmarxApiError on a non-OK response', async () => {
      mockError(403, 'Forbidden');
      await expect(client.authenticate(AUTH_PATH)).rejects.toBeInstanceOf(CheckmarxApiError);
    });
  });

  describe('error handling', () => {
    it('throws CheckmarxApiError with status and statusText', async () => {
      mockError(404, 'Not Found');
      try {
        await client.projects();
        fail('Expected error to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(CheckmarxApiError);
        const apiError = err as CheckmarxApiError;
        expect(apiError.status).toBe(404);
        expect(apiError.statusText).toBe('Not Found');
      }
    });

    it('throws CheckmarxApiError with the correct message format', async () => {
      mockError(403, 'Forbidden');
      await expect(client.scans()).rejects.toThrow('Checkmarx API error: 403 Forbidden');
    });

    it('throws CheckmarxApiError with name "CheckmarxApiError"', async () => {
      mockError(500, 'Internal Server Error');
      try {
        await client.projects();
        fail('Expected error to be thrown');
      } catch (err) {
        expect((err as Error).name).toBe('CheckmarxApiError');
      }
    });
  });
});
