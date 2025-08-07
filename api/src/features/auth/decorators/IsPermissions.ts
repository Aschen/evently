import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ async: false })
class IsPermissionsConstraint implements ValidatorConstraintInterface {
  validate(permissions: any) {
    if (!Array.isArray(permissions)) {
      return false
    }
    for (const permission of permissions) {
      if (
        typeof permission !== 'string' ||
        (permission !== '*' && !permission.startsWith('api/'))
      ) {
        return false
      }
    }
    return true
  }

  defaultMessage() {
    return 'Each permission must be a string prefixed by "api/", or be "*"'
  }
}

/**
 * Validate that the parameter is an array of valid API permissions
 */
export function IsPermissions(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPermissionsConstraint,
    })
  }
}
