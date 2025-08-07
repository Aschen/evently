import { text, uuid } from 'drizzle-orm/pg-core'
import { BaseSchema } from 'src/libs/database/data/BaseSchema'
import { timestampsFields } from 'src/libs/database/helpers/table-helpers'

export const userRoleEnum = BaseSchema.enum('user_role', ['user', 'admin'])

export type UserRole = (typeof userRoleEnum.enumValues)[number]

export const UsersTable = BaseSchema.table('users', {
  /**
   * Unique identifier for the user
   */
  id: uuid('id').primaryKey().defaultRandom(),

  /**
   * The email of the user
   */
  email: text('email').notNull(),

  /**
   * The role of the user
   */
  role: userRoleEnum('role').notNull(),

  ...timestampsFields(),
})
