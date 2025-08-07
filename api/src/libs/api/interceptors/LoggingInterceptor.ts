import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { createDebug } from 'src/libs/observability/debug'

const debug = createDebug('api')

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const controller = context.getClass().name
    const handler = context.getHandler().name
    const request = context.switchToHttp().getRequest()
    const params = Object.keys(request.params ?? {}).length
      ? request.params
      : undefined
    const body = Object.keys(request.body ?? {}).length
      ? request.body
      : undefined
    const query = Object.keys(request.query ?? {}).length
      ? request.query
      : undefined

    return next.handle().pipe(
      tap(() => {
        debug?.(
          `"${controller}:${handler}"${query ? ` Query ${JSON.stringify(query)}` : ''}${params ? ` Params ${JSON.stringify(params)}` : ''}${body ? ` Body ${JSON.stringify(body)}` : ''}`
        )
      })
    )
  }
}
