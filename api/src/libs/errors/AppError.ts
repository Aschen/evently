import { randomUUID } from 'node:crypto'
import type { AppErrorCodes } from './App.error'

/**
 * Works in browser and Node.js
 *
 * We only need to strip stack trace in Node.js production environment
 */
const EXCLUDE_STACK = () =>
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production'

export type AppErrorOptions = {
  message: string
  error?: Error | unknown
  id?: string
  context?: Record<string, unknown>
} & AppErrorCodes

export class AppError extends Error {
  public id: string
  public status: AppErrorCodes['status']
  public code: AppErrorCodes['code']
  public context?: Record<string, unknown>

  /**
   * Optional ID to track the error
   */
  public requestId: string | undefined

  /**
   * This method can be used to ensure a correct instance of AppError will
   * be returned.
   *
   * Other error will be wrapped if necessary.
   */
  static wrap(error: unknown): AppError {
    if (error instanceof Error) {
      return new this({
        message: error.message,
        code: 'error.unknown',
        status: 500,
        error,
      })
    }

    return new this({
      message: `Unknown error "${error}"`,
      code: 'error.unknown',
      status: 500,
    })
  }

  /**
   * Create a new error.
   *
   * @param message The error message should be explicit so a developer can understand what went wrong.
   * @param status HTTP status code of the error. 40*: error from processing a request (or client fault), 50*: error from the server (or server fault)
   * @param code A unique code for the error. Format must be snake_case and it can contains different part separated by dots.
   * @param error An optional original error that can be used to get the stack trace.
   * @param id An optional unique identifier for the error. If not provided, a random one will be generated.
   * @param context An optional object that can be used to provide additional information about the error.
   *
   * @example
   * ```
   * throw new AppError({
   *   message: `User "${userId}" not found`,
   *   code: 'user.not_found',
   *   status: 404,
   * })
   *
   * // or with an original error to keep stacktrace
   *
   * try {
   *   await someAsyncFunction()
   * }
   * catch (error) {
   *  throw new AppError({
   *   message: `An error occurred while processing the request`,
   *   code: 'error.unknown',
   *   status: 500,
   *   error,
   *  })
   * }
   * ```
   */
  constructor({
    message,
    status,
    code,
    error,
    context,
    id = randomUUID(),
  }: AppErrorOptions) {
    super(message, { cause: error })

    this.id = id
    this.status = status
    this.code = code
    this.context = context

    if (error instanceof Error) {
      this.stack = error.stack

      // Required so the logger also print the stacktrace
      Object.defineProperty(this, 'stack', { enumerable: true })
    }
  }

  /**
   * This function should be used to serialize the error before
   * sending it to the client.
   *
   * In production, the stack trace should not be sent to the client
   * for security reasons.
   */
  serialize({
    excludeStack = EXCLUDE_STACK(),
    requestId,
  }: { excludeStack?: boolean; requestId?: string } = {}) {
    const cause = this.cause as unknown as Error
    return {
      id: this.id,
      message: this.message,
      code: this.code,
      status: this.status,
      stack: excludeStack ? undefined : this.stack,
      context: this.context,
      requestId: requestId ?? this.requestId,
      cause: {
        message: cause?.message,
        stack: excludeStack ? undefined : cause?.stack,
      },
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return 'code' in (error as AppError)
}

export function isAppErrorSerializable(error: unknown): error is AppError {
  return typeof (error as AppError).serialize === 'function'
}
