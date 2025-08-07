import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { AppError } from 'src/libs/errors/AppError'
import { JWTPayload } from '../types/JWTPayload'

/**
 * Decorator that extracts the userId from the request payload
 */
export const UserId = createParamDecorator(
  (
    data: {
      /**
       * If true, null is returned if the user is not authenticated
       * Default: false, throws an error if the user is not authenticated
       */
      allowAnonymous?: boolean
    },
    ctx: ExecutionContext
  ) => {
    const req = ctx.switchToHttp().getRequest()
    const payload = req.jwtPayload as JWTPayload | undefined

    if (data?.allowAnonymous && !payload) {
      return null
    }

    if (process.env.NODE_ENV !== 'production' && !payload) {
      throw new AppError({
        code: 'security.invalid_token',
        status: 401,
        message: 'No token found',
      })
    }

    if (!payload?.userId) {
      throw new AppError({
        code: 'security.invalid_token',
        status: 401,
        message: 'Invalid token',
      })
    }

    return payload.userId
  }
)
