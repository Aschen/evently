import { text, uuid } from 'drizzle-orm/pg-core'
import { BaseSchema } from 'src/libs/database/data/BaseSchema'
import { timestampsFields } from 'src/libs/database/helpers/table-helpers'
import { UsersTable } from './UsersTable'

export const credentialTypeEnum = BaseSchema.enum('credential_type', ['token'])

export const CredentialsTable = BaseSchema.table('credentials', {
  /**
   * Unique identifier for the credential
   */
  id: uuid('id').primaryKey().defaultRandom(),

  /**
   * The user ID this credential belongs to
   */
  userId: uuid('user_id')
    .notNull()
    .references(() => UsersTable.id, { onDelete: 'cascade' }),

  /**
   * The bcrypt hash of the password
   */
  password: text('password').notNull(),

  /**
   * The type of the credential
   */
  type: credentialTypeEnum('type').notNull(),

  ...timestampsFields(),
})
