import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger'
import { AuthGuard } from '../guards/AuthGuard'

/**
 * This decorator verifies that the user has a valid JWT if one is provided
 * if no JWT is provided, the user is considered anonymous
 */
export function VerifyJWT() {
  return applyDecorators(
    SetMetadata('allowAnonymous', true),
    UseGuards(AuthGuard),
    ApiBearerAuth(),
    ApiCookieAuth()
  )
}
