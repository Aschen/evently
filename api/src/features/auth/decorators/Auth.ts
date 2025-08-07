import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger'
import { AuthGuard } from '../guards/AuthGuard'
import { RolesGuard, ROLES_KEY } from '../guards/RolesGuard'
import { UserRole } from 'src/features/users/data/UsersTable'

export const API_ACTION_KEY = 'apiAction'

/**
 * This decorator is used to protect a route by checking the user's authentication and optionally their roles
 */
export function Auth({
  /**
   * The action that the user must have permission to perform
   * @example 'group:create'
   */
  apiAction,
  /**
   * The roles that are allowed to access this route
   * If provided, the user must have at least one of these roles
   * @example ['admin', 'user']
   */
  roles,
}: {
  apiAction: string
  roles?: UserRole[]
}) {
  const decorators = [
    SetMetadata(API_ACTION_KEY, apiAction),
    UseGuards(AuthGuard),
    ApiBearerAuth(),
    ApiCookieAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ]

  // If roles are specified, add role-based authorization
  if (roles && roles.length > 0) {
    decorators.push(
      SetMetadata(ROLES_KEY, roles),
      UseGuards(RolesGuard),
      ApiForbiddenResponse({
        description: 'Forbidden - insufficient role permissions',
      })
    )
  }

  return applyDecorators(...decorators)
}
