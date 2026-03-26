/**
 * Response returned by the Checkmarx authentication endpoint.
 *
 * Use `token_type` and `access_token` together to build the Authorization header:
 * `${token_type} ${access_token}`
 */
export interface CheckmarxAuthResponse {
  /** Token type, typically `'Bearer'` */
  token_type: string;
  /** The access token to use for subsequent API calls */
  access_token: string;
}
