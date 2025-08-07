import { Repository } from 'src/libs/database/data/Repository'
import { UsersTable } from './UsersTable'

export type User = typeof UsersTable.$inferSelect
export class UsersRepository extends Repository<typeof UsersTable> {
  constructor() {
    super(UsersTable)
  }
}
