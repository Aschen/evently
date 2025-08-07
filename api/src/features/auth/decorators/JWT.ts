import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JWTPayload } from '../types/JWTPayload'

export function jwtDecoratorCb(data: {}, ctx: ExecutionContext) {
  const req = ctx.switchToHttp().getRequest()
  const token = req.jwtPayload as JWTPayload | undefined

  return token
}

/**
 * Decorator that extracts the JWT from the request
 * @param payload If true, the payload is returned instead of the token
 */
export const JWT = createParamDecorator(jwtDecoratorCb)
