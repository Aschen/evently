import { UseInterceptors, applyDecorators } from '@nestjs/common'
import { ApiResponse, ApiResponseMetadata } from '@nestjs/swagger'
import { ResponseValidationInterceptor } from '../interceptors/ResponseValidatorInterceptor'

/**
 * This validator is similar to ApiResponse used to generate the OpenAPI documentation
 * but it also validates the response data against the DTO.
 *
 * @example
 * ```ts
 * class UserController {
 *   @ApiOperation({ description: 'Get a user' })
 *   @ApiValidatedResponse({ type: UserDto })
 *   @Get('user/:id')
 *   async getUser(@Param('id') id: string) {
 *     return this.userService.getUser(id)
 *   }
 * }
 * ```
 */
export function ApiValidatedResponse<T extends object>(
  options: Omit<ApiResponseMetadata, 'type'> & {
    /**
     * If true, the validation will fail if there are properties there are more properties than the ones defined in the class
     * If false, the validation will strip extra properties
     */
    forbidNonWhitelisted?: boolean
    type?: new () => T
  }
) {
  return applyDecorators(
    ApiResponse(options),
    UseInterceptors(
      new ResponseValidationInterceptor<T>({
        type: options.type ?? null,
        forbidNonWhitelisted: options.forbidNonWhitelisted,
      })
    )
  )
}
