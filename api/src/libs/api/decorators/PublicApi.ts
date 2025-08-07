import { SetMetadata } from '@nestjs/common'

export const PUBLIC_API_KEY = 'public_api'

/**
 * This decorator allows to specify that a route is public
 * (e.g. no authentication required).
 *
 * Cannot be used at the same time as the `@Auth` decorator.
 *
 * @see file://./../guards/EnsureAuthGuard.ts
 */
export const PublicApi = () => SetMetadata(PUBLIC_API_KEY, true)
