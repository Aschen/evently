import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import createDebug from 'debug'
import { Request } from 'express'
import { AppError } from 'src/libs/errors/AppError'
import { AuthService } from '../services/AuthService'
import { logger } from 'src/libs/observability/logger'

const debug = createDebug('exception')

/**
 * Guard that checks if the user is authenticated.
 * It extracts the JWT token from the Authorization header and verifies it.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    protected readonly reflector: Reflector,
    protected readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest()

      const token =
        this.extractTokenFromHeader(request) ??
        this.extractTokenFromCookie(request) ??
        this.extractTokenFromQuery(request)

      if (!token) {
        const allowAnonymous = this.reflector.get<boolean>(
          'allowAnonymous',
          context.getHandler()
        )

        if (allowAnonymous) {
          return true
        }

        throw new AppError({
          code: 'security.missing_token',
          status: 401,
          message: 'Missing token',
        })
      }

      const payload = await this.authService.verifyToken(token)

      /**
       * Thoses fields are required in the payload.
       */
      if (!payload) {
        throw new AppError({
          code: 'security.invalid_token',
          status: 401,
          message: 'Access to the API is denied',
        })
      }

      // Payload is attached to the request object. So we can access it in the controllers.
      request['jwt'] = token
      request['jwtPayload'] = payload

      return true
    } catch (e) {
      debug('%s', e.stack || e.message)

      if (e instanceof AppError && (e.status === 401 || e.status === 403)) {
        throw e
      }

      throw new AppError({
        code: 'security.invalid_token',
        status: 401,
        message: 'Access to the API is denied',
        error: e,
      })
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers['authorization']?.split(' ') ?? []
    return type === 'Bearer' ? (token ?? null) : null
  }

  /**
   * This will extract auth token from the cookie that have been emitted for the current domain
   * that is currently making the request.
   */
  private extractTokenFromCookie(request: Request): string | null {
    const host = request.headers['origin'] ?? request.headers['referer']

    if (!host) {
      return null
    }

    const cookieSpec = this.authService.getCookieSpec(host)

    // TODO: should use signedCookies instead of cookies
    const cookieValue = request.cookies[cookieSpec.name]

    if (!cookieValue) {
      return null
    }

    return cookieValue
  }

  /**
   * Useful in development mode or when cookies are disabled.
   */
  private extractTokenFromQuery(request: Request): string | null {
    const token = request.query.jwt

    return typeof token === 'string' ? token : null
  }
}
