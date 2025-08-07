import { inspect } from 'node:util'
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { validate, ValidationError, ValidatorOptions } from 'class-validator'
import { Observable } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { AppError } from 'src/libs/errors/AppError'

/**
 * Format the validation errors to a human readable string
 */
function formatValidationErrors(
  errors: ValidationError[],
  parent: string = ''
): string {
  const errorMessage = errors
    .map((error) => error.toString(true, false, parent, true))
    .join()

  // If we are in development, we want to see the response content to debug
  if (process.env.NODE_ENV !== 'production') {
    return [
      errorMessage,
      'Response content:\n',
      inspect(errors.at(0)?.target, { depth: 10 }),
      '\n',
    ].join('')
  }

  return errorMessage
}

@Injectable()
export class ResponseValidationInterceptor<T extends object>
  implements NestInterceptor<any, T>
{
  private readonly type: (new () => T) | null
  private readonly forbidNonWhitelisted: boolean

  constructor({
    /**
     * The class to validate
     */
    type,
    /**
     * If true, the validation will fail if there are properties there are more properties than the ones defined in the class
     * If false, the validation will strip extra properties
     */
    forbidNonWhitelisted = false,
  }: {
    type: (new () => T) | null

    forbidNonWhitelisted?: boolean
  }) {
    this.type = type
    this.forbidNonWhitelisted = forbidNonWhitelisted
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle().pipe(
      switchMap(async (data) => {
        /**
         * Do not validate in production, speed up the response.
         * Only validate in development and test environments to catch errors early
         */
        if (process.env.NODE_ENV === 'production') {
          return data
        }

        if (data instanceof StreamableFile) {
          return data as any
        }

        if (this.type === null) {
          return data
        }

        if (data && (typeof data !== 'object' || Array.isArray(data))) {
          const error = ['The response is not an object']

          if (process.env.NODE_ENV !== 'production') {
            error.push('\nResponse content:\n')
            error.push(inspect(data, { depth: 10 }))
          }

          throw new AppError({
            code: 'api.validation.outgoing_failed',
            message: error.join(''),
            status: 500,
            context: {
              data,
            },
          })
        }

        const transformedData = plainToInstance(
          this.type,
          instanceToPlain(data)
        )

        const validationOptions: ValidatorOptions = {
          forbidNonWhitelisted: this.forbidNonWhitelisted,
        }

        const errors = await validate(transformedData, validationOptions)

        if (errors.length > 0) {
          throw new AppError({
            code: 'api.validation.outgoing_failed',
            message: formatValidationErrors(errors),
            status: 500,
            context: {
              class: this.type,
              errors,
              data,
            },
          })
        }

        return transformedData
      })
    )
  }
}
