import { eq, and } from 'drizzle-orm'
import { Repository } from 'src/libs/database/data/Repository'
import { CredentialsTable, credentialTypeEnum } from './CredentialsTable'
import { ConvertPGEnum } from 'src/libs/database/helpers/table-helpers'

export type Credential = typeof CredentialsTable.$inferSelect
export type CredentialType = ConvertPGEnum<typeof credentialTypeEnum>

export class CredentialsRepository extends Repository<typeof CredentialsTable> {
  constructor() {
    super(CredentialsTable)
  }
}
