import type { UserRole } from 'src/features/users/data/UsersTable'
import { UsersService } from 'src/features/users/services/UsersService'
import { UsersRepository } from '../../data/UsersRepository'
import { CredentialsRepository } from '../../data/CredentialsRepository'

export function createUser({
  email,
  password,
  role,
}: {
  email: string
  password: string
  role: UserRole
}) {
  const usersService = new UsersService(
    new UsersRepository(),
    new CredentialsRepository()
  )

  return usersService.create({
    email,
    password,
    role,
  })
}
