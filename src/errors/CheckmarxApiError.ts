/**
 * Thrown when the Checkmarx API returns a non-2xx response.
 *
 * @example
 * ```typescript
 * import { CheckmarxApiError } from 'checkmarx-api-client';
 *
 * try {
 *   await cx.project('nonexistent-id');
 * } catch (err) {
 *   if (err instanceof CheckmarxApiError) {
 *     console.log(err.status);     // 404
 *     console.log(err.statusText); // 'Not Found'
 *     console.log(err.message);    // 'Checkmarx API error: 404 Not Found'
 *   }
 * }
 * ```
 */
export class CheckmarxApiError extends Error {
  /** HTTP status code (e.g. `404`, `401`, `403`) */
  readonly status: number;
  /** HTTP status text (e.g. `'Not Found'`, `'Unauthorized'`) */
  readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`Checkmarx API error: ${status} ${statusText}`);
    this.name = 'CheckmarxApiError';
    this.status = status;
    this.statusText = statusText;
  }
}
