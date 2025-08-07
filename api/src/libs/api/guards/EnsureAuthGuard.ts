import { CanActivate, Injectable, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PUBLIC_API_KEY } from '../decorators/PublicApi'
import { API_ACTION_KEY } from 'src/features/auth/decorators/Auth'
import { AppError } from 'src/libs/errors/AppError'

const isDev = ['development', 'test'].includes(process.env.NODE_ENV ?? '')

/**
 * This guard ensures that a `@Auth` decorator is present on the controller or
 * action, with a non-empty `apiAction` value, allowing to check the presence of
 * the required authentication and authorization on the request.
 *
 * If no `@Auth` decorator is present, the request is denied, unless the
 * `@PublicApi` decorator is present.
 *
 * If both `@Auth` and `@PublicApi` decorators are present, an error is thrown.
 */
@Injectable()
export class EnsureAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const apiAction = this.reflector.getAllAndOverride<string>(API_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const hasAuth = !!apiAction

    // Check if both @PublicApi and @Auth are present
    if (isPublic && hasAuth) {
      throw new AppError({
        code: 'error.assertion',
        status: 500,
        message:
          'Cannot use both @PublicApi and @Auth decorators on the same route',
      })
    }

    // In development, ensure routes have either @PublicApi or @Auth
    if (isDev && !isPublic && !hasAuth) {
      throw new AppError({
        code: 'error.assertion',
        status: 500,
        message:
          'This route has no authentication decorator (@Auth or @PublicApi) defined, and cannot be accessed',
      })
    }

    // Allow the request to proceed - the actual authentication/authorization
    // is handled by AuthGuard and RolesGuard
    return true
  }
}
