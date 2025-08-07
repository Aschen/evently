import { ValidateIf, ValidationOptions } from 'class-validator'

/**
 * Checks if value is null and if so, ignores all validators.
 */
export function IsNullable(options?: ValidationOptions): PropertyDecorator {
  return function IsNullableDecorator(
    prototype: object,
    propertyKey: string | symbol
  ) {
    ValidateIf((obj) => obj[propertyKey] !== null, options)(
      prototype,
      propertyKey
    )
  }
}
