import { CanActivate, ExecutionContext } from '@nestjs/common'
import debug from 'debug'
import { AppError } from 'src/libs/errors/AppError'
import { JWTPayload } from '../types/JWTPayload'

const logException = debug('evently:exception')

export abstract class BaseAuthenticatedGuard implements CanActivate {
  constructor() {}

  /**
   * Verify that the route is allowed to accessed
   */
  abstract isAllowed(
    context: ExecutionContext,
    jwtPayload: JWTPayload
  ): Promise<boolean>

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest()

      const payload = request['jwtPayload'] as JWTPayload

      if (!payload) {
        throw new AppError({
          code: 'security.missing_token',
          status: 401,
          message: 'Missing token',
        })
      }

      return this.isAllowed(context, payload)
    } catch (e) {
      logException('%s', e.stack || e.message)

      if (e instanceof AppError && (e.status === 401 || e.status === 403)) {
        throw e
      }

      throw new AppError({
        code: 'security.invalid_token',
        status: 401,
        message: 'Access to the API is denied',
      })
    }
  }
}
