/**
 * Handles Bearer Token Authentication for Checkmarx On-Premise REST API requests.
 *
 * @example
 * ```typescript
 * const security = new Security(
 *   'https://checkmarx.example.com',
 *   'my-bearer-token'
 * );
 *
 * const headers = security.getHeaders();
 * // { Authorization: 'Bearer <token>', 'Content-Type': 'application/json', Accept: 'application/json' }
 * ```
 */
export class Security {
  private readonly apiUrl: string;
  private authorizationHeader: string;

  /**
   * Creates a new Security instance with Bearer Token Authentication credentials.
   *
   * @param apiUrl - The base URL of the Checkmarx instance (e.g., `https://checkmarx.example.com`).
   *   Must be a valid URL; throws if it cannot be parsed.
   * @param token - The bearer token or refresh token to authenticate with
   *
   * @throws {TypeError} If `apiUrl` is not a valid URL
   */
  constructor(apiUrl: string, token: string) {
    if (!URL.canParse(apiUrl)) {
      throw new TypeError(`Invalid apiUrl: "${apiUrl}" is not a valid URL`);
    }
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.authorizationHeader = `Bearer ${token}`;
  }

  /**
   * Returns the base URL of the Checkmarx instance, without a trailing slash.
   *
   * @returns The API base URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Returns the value of the `Authorization` header for Bearer Authentication.
   *
   * @returns The Authorization header value in the format `Bearer <access_token>`
   */
  getAuthorizationHeader(): string {
    return this.authorizationHeader;
  }

  /**
   * Returns the full set of HTTP headers required for authenticated API requests.
   *
   * @returns An object containing `Authorization`, `Content-Type`, and `Accept` headers
   */
  getHeaders(): Record<string, string> {
    return {
      Authorization: this.authorizationHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Updates the Authorization header with a new access token obtained from the auth endpoint.
   * Called automatically by {@link CheckmarxClient.authenticate} after a successful token exchange.
   *
   * @param tokenType - The token type returned by the auth endpoint (e.g., `'Bearer'`)
   * @param accessToken - The access token returned by the auth endpoint
   */
  updateToken(tokenType: string, accessToken: string): void {
    this.authorizationHeader = `${tokenType} ${accessToken}`;
  }
}
