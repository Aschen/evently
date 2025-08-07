import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common'
import debug from 'debug'
import { Request, Response } from 'express'
import { AppAsyncStorage } from 'src/libs/asyncStorage/AppAsyncStorage'
import { AppError } from 'src/libs/errors/AppError'

const logException = debug('evently:exception')
const logUnhandledException = debug('evently:unhandled-exception')

type ExceptionContent = {
  id?: string
  status: number
  message: string
  code: string
  stack?: string
  context?: Record<string, unknown>
  requestId?: string
  cause?: {
    message?: string
    stack?: string
  }
}

function shouldExcludeStack(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Exception filter that logs errors and format exceptions as JSON responses
 */
@Catch(Error)
export class AppExceptionFilter implements ExceptionFilter {
  /**
   * Extract the content of an exception to be returned as a JSON response
   */
  extractExceptionContent(exception: Error): ExceptionContent {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse()
      const exceptionMessage =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as { message?: string[] })?.message?.toString()
          : exceptionResponse

      const response = {
        status: exception.getStatus(),
        code: 'api.internal_error',
        message: exceptionMessage || exception.stack || exception.message,
        stack: shouldExcludeStack() ? undefined : exception.stack,
        requestId: AppAsyncStorage.getStore()?.requestId,
      }

      return response
    }

    if (exception instanceof AppError) {
      return exception.serialize({
        excludeStack: shouldExcludeStack(),
        requestId: AppAsyncStorage.getStore()?.requestId,
      })
    }

    return AppError.wrap(exception).serialize({
      excludeStack: shouldExcludeStack(),
      requestId: AppAsyncStorage.getStore()?.requestId,
    })
  }

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const req = ctx.getRequest<Request>()
    const res = ctx.getResponse<Response>()
    const route = req.url
    const method = req.method

    const logMethod =
      exception instanceof HttpException || exception instanceof AppError
        ? logException
        : logUnhandledException

    const content = this.extractExceptionContent(exception)

    logMethod(
      '[%s] %s: %s\n  stack: %s\n',
      method,
      route,
      content.message,
      content.stack,
      {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      },
      content.context,
      content.cause
    )

    return res.status(content.status).json(content).send()
  }
}
