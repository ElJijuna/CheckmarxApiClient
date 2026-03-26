# checkmarx-api-client

[![CI](https://github.com/ElJijuna/CheckmarxApiClient/actions/workflows/ci.yml/badge.svg)](https://github.com/ElJijuna/CheckmarxApiClient/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/checkmarx-api-client)](https://www.npmjs.com/package/checkmarx-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

TypeScript client for the Checkmarx On-Premise REST API.
Works in **Node.js** and the **browser** (isomorphic). Fully typed, zero runtime dependencies.

---

## Installation

```bash
npm install checkmarx-api-client
```

---

## Quick start

```typescript
import { CheckmarxClient } from 'checkmarx-api-client';

const cx = new CheckmarxClient({
  apiUrl:  'https://checkmarx.example.com',
  apiPath: 'api',
  token:   'your-api-token',
});
```

---

## API reference

### Projects

```typescript
// List all projects
const result = await cx.projects();
const result = await cx.projects({ limit: 50, name: 'my-app' });
const result = await cx.projects({ ids: 'uuid1,uuid2', tags: 'team:backend' });

result.projects            // CheckmarxProject[]
result.totalCount          // number
result.filteredTotalCount  // number

// Get a single project
const project = await cx.project('project-uuid');

// Get project branches
const branches = await cx.project('project-uuid').branches();
const branches = await cx.project('project-uuid').branches({ branchName: 'main' });
const branches = await cx.project('project-uuid').branches({ limit: 25, offset: 0 });
```

### Scans

```typescript
// List scans
const result = await cx.scans();
const result = await cx.scans({ 'project-id': 'project-uuid' });
const result = await cx.scans({
  'project-id': 'project-uuid',
  branch:       'main',
  status:       'Completed',
  limit:        25,
  offset:       0,
});

result.scans               // CheckmarxScan[]
result.totalCount          // number
result.filteredTotalCount  // number
```

### Scan summary

```typescript
// Get summary for one or more scans
const summaries = await cx.scanSummary({ 'scan-ids': 'scan-uuid-1,scan-uuid-2' });
const summaries = await cx.scanSummary({
  'scan-ids':               'scan-uuid',
  'include-queries':        true,
  'include-status-counters': true,
});

// summaries[0].sastCounters.highCounter
// summaries[0].scaCounters.totalCounter
// summaries[0].kicsCounters.mediumCounter
```

### Reports

```typescript
// Request a new report
const { reportId } = await cx.createReport({
  reportName: 'my-report',
  fileFormat: 'PDF',
  reportType: 'ui',
  data: {
    projectId:  'project-uuid',
    scanId:     'scan-uuid',
    branchName: 'main',
  },
});

// Download the report (returns ArrayBuffer — save to disk or stream)
const buffer = await cx.downloadReport(reportId);
```

### Projects overview

```typescript
// Overview across all projects
const result = await cx.projectsOverview();
const result = await cx.projectsOverview({
  'project-ids': 'uuid1,uuid2',
  'branch-name': 'main',
  limit:         50,
  offset:        0,
});

result.projectsOverviewItems   // CheckmarxProjectOverview[]
result.totalCount              // number
result.filteredTotalCount      // number
```

---

## Chainable resource pattern

`project(id)` implements `PromiseLike`, so it can be **awaited directly** or **chained** to access sub-resources:

```typescript
// Await directly → fetches the project
const project = await cx.project('project-uuid');

// Chain → fetches branches
const branches = await cx.project('project-uuid').branches({ branchName: 'main' });
```

---

## Request events

Subscribe to every HTTP request for logging, monitoring, or debugging:

```typescript
cx.on('request', (event) => {
  console.log(`[${event.method}] ${event.url} → ${event.statusCode} (${event.durationMs}ms)`);
  if (event.error) {
    console.error('Request failed:', event.error.message);
  }
});
```

The `event` object contains:

| Field | Type | Description |
|---|---|---|
| `url` | `string` | Full URL that was requested |
| `method` | `'GET' \| 'POST'` | HTTP method used |
| `startedAt` | `Date` | When the request started |
| `finishedAt` | `Date` | When the request finished |
| `durationMs` | `number` | Duration in milliseconds |
| `statusCode` | `number \| undefined` | HTTP status code, if a response was received |
| `error` | `Error \| undefined` | Present only if the request failed |

Multiple listeners can be registered. The event is always emitted whether the request succeeded or failed.

---

## Error handling

Non-2xx responses throw a `CheckmarxApiError` with the HTTP status code and status text:

```typescript
import { CheckmarxApiError } from 'checkmarx-api-client';

try {
  await cx.project('nonexistent-uuid');
} catch (err) {
  if (err instanceof CheckmarxApiError) {
    console.log(err.status);     // 404
    console.log(err.statusText); // 'Not Found'
    console.log(err.message);    // 'Checkmarx API error: 404 Not Found'
    console.log(err.stack);      // full stack trace
  }
}
```

---

## Authentication

The client uses **Bearer token** authentication. Pass your API key or JWT token directly:

```typescript
const cx = new CheckmarxClient({
  apiUrl:  'https://checkmarx.example.com',
  apiPath: 'api',
  token:   'your-api-token',
});
```

---

## TypeScript types

All domain types are exported:

```typescript
import type {
  // Core
  CheckmarxClientOptions,
  RequestEvent,
  CheckmarxClientEvents,
  // Errors
  CheckmarxApiError,
  // Projects
  CheckmarxProject,
  ProjectsParams,
  // Branches
  CheckmarxBranch,
  BranchesParams,
  // Scans
  CheckmarxScan,
  CheckmarxScanStatus,
  CheckmarxScanStatusDetail,
  ScansParams,
  // Scan summary
  CheckmarxScanSummary,
  CheckmarxSastCounters,
  CheckmarxScaCounters,
  CheckmarxKicsCounters,
  ScanSummaryParams,
  // Reports
  CheckmarxReportRequest,
  CheckmarxReportFormat,
  CheckmarxReportData,
  CheckmarxReportResponse,
  CheckmarxReportStatus,
  CheckmarxReportStatusValue,
  // Projects overview
  CheckmarxProjectOverview,
  ProjectsOverviewParams,
} from 'checkmarx-api-client';
```

---

## Documentation

Full API documentation is published at:
**[https://eljijuna.github.io/CheckmarxApiClient](https://eljijuna.github.io/CheckmarxApiClient)**

---

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md).

---

## License

[MIT](LICENSE)
