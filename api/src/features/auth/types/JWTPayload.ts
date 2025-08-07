import type { UserRole } from 'src/features/users/data/UsersTable'

export type ApiTokenPayload = {
  type: 'token'

  /**
   * The user ID of the user the token was issued for
   */
  userId: string

  /**
   * The role of the user
   */
  role: UserRole
}

export type JWTPayload = ApiTokenPayload
