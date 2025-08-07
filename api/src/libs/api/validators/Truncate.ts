import { ValidationOptions } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * Truncates the string to display a shorter version of it.
 *
 * @example
 * `eyJhbGciOi[...]rhMlX9SQIo`
 */
export function Truncate(
  options?: ValidationOptions & {
    /**
     * The length to truncate the string to.
     * Default: 10
     */
    length?: number
  }
): PropertyDecorator {
  return function TruncateDecorator(
    prototype: object,
    propertyKey: string | symbol
  ) {
    const length = options?.length ?? 10

    Transform(
      ({ value }) =>
        `${value?.slice(0, length)}[...]${value?.slice(value.length - length)}`,
      options
    )(prototype, propertyKey)
  }
}
