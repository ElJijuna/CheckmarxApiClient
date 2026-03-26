---
name: Feature request
about: Suggest a new endpoint or capability
labels: enhancement
---

## What endpoint or feature do you need?

Describe the Checkmarx API endpoint or behavior you want added.
Include the HTTP method and path if applicable (e.g., `GET /api/projects/:projectId/branches`).

## Proposed API

```typescript
// How you'd like to call it
const branches = await cx.project('project-uuid').branches({ branchName: 'main' });
```

## Why is this useful?

Explain your use case.
