import { Injectable, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AppError } from 'src/libs/errors/AppError'
import { BaseAuthenticatedGuard } from './BaseAuthenticatedGuard'
import { JWTPayload } from '../types/JWTPayload'
import { UserRole } from 'src/features/users/data/UsersTable'

export const ROLES_KEY = 'roles'

/**
 * Guard that checks if the authenticated user has one of the required roles
 */
@Injectable()
export class RolesGuard extends BaseAuthenticatedGuard {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  async isAllowed(
    context: ExecutionContext,
    jwtPayload: JWTPayload
  ): Promise<boolean> {
    const requiredRoles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler()
    )

    if (!requiredRoles || requiredRoles.length === 0) {
      // If no roles are specified, allow access
      return true
    }

    if (jwtPayload.role === 'admin') {
      return true
    }

    // Check if the user's role (from JWT) is in the required roles array
    const hasRequiredRole = requiredRoles.includes(jwtPayload.role)
    const controllerName = context.getClass().name
    const actionName = context.getHandler().name

    if (!hasRequiredRole) {
      throw new AppError({
        code: 'security.access_denied',
        status: 403,
        message: `${controllerName}:${actionName} - Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${jwtPayload.role}`,
        context: {
          userId: jwtPayload.userId,
          userRole: jwtPayload.role,
          requiredRoles,
        },
      })
    }

    return true
  }
}
