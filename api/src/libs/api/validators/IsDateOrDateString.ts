import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'

export function IsDateOrDateString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateOrDateString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value instanceof Date) {
            return !isNaN(value.getTime())
          }

          if (typeof value === 'string') {
            const date = new Date(value)
            return !isNaN(date.getTime())
          }

          return false
        },
      },
    })
  }
}
