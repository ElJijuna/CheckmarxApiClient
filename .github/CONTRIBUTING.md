# Contributing

Thank you for your interest in contributing!

## Development setup

```bash
git clone https://github.com/ElJijuna/CheckmarxApiClient.git
cd CheckmarxApiClient
npm install
```

## Running tests

```bash
npm test
```

## Building

```bash
npm run build
```

## Commit convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and
[semantic-release](https://semantic-release.gitbook.io/semantic-release/) to automate versioning and changelog generation.

| Prefix | Effect |
|---|---|
| `feat:` | Minor version bump |
| `fix:` | Patch version bump |
| `feat!:` / `BREAKING CHANGE:` | Major version bump |
| `docs:`, `chore:`, `refactor:`, `test:` | No release |

Examples:

```
feat: add projects-overview endpoint
fix: handle empty scan-summary response
docs: add createReport example to README
```

## Adding a new endpoint

1. Create a domain type in `src/domain/` if the response shape is new.
2. Add the method to the appropriate resource in `src/resources/`, or directly to `CheckmarxClient` if it is a top-level endpoint.
3. Export the type from `src/index.ts`.
4. Add tests in `tests/CheckmarxClient.test.ts` following the existing patterns.
5. Update `README.md` with a usage example.

## Pull requests

- Open a PR against `main`.
- Ensure `npm test` passes locally before pushing.
- One logical change per PR.
