/**
 * This file was auto-generated from api-schema.d.ts
 * Do not make direct changes to this file.
 */

export type UserDto = {
  /**
   * @description User ID
   * @example 123
   */
  id: string
  /**
   * @description Email of the user
   * @example john.doe@example.com
   */
  email: string
  /** @description Role name the user has */
  role: string
}

export type CurrentUserResponseDTO = {
  /** @description User information */
  user: UserDto
}

export type LoginWithPasswordParamsDto = {
  /**
   * @description Email of the user
   * @example john.doe@example.com
   */
  email: string
  /**
   * @description Password of the user
   * @example securePassword123
   */
  password: string
  /**
   * @description Whether to return the token in the response. An error will be thrown if no origin header is provided and returnToken is false
   * @example true
   */
  returnToken: boolean
}

export type LoginWithPasswordResponseDto = {
  /**
   * @description JWT token for authentication. Only returned if returnToken is true
   * @example eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   */
  token: string
}

export type UsersListResponseDto = {
  users: UserDto[]
  /**
   * @description Total number of users matching the criteria
   * @example 100
   */
  total: number
}

export type UserGetResponseDto = {
  user: UserDto
}

export type UsersCreateParamsDto = {
  /**
   * @description Email of the user
   * @example john.doe@example.com
   */
  email: string
  /**
   * @description Password of the user
   * @example securePassword123
   */
  password: string
  /**
   * @description Role of the user
   * @example user
   * @enum {string}
   */
  role: 'user' | 'admin'
}

export type UsersCreateResponseDto = {
  user: UserDto
}

export type HealthCheckResponseDto = {
  /**
   * @description The overall status of the system
   * @enum {string}
   */
  status: 'healthy' | 'unhealthy'
  /** @description Status of individual services */
  services: Record<string, never>
}
