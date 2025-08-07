/**
 * Represents available API permissions in the application.
 *
 * @example `api/user:list`
 */
export type PermissionsApi = `api/${string}`

/**
 * Represents available permissions in the application.
 * - `api/*` permissions
 */
export type Permissions = PermissionsApi | '*'
