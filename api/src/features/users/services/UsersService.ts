import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../data/UsersRepository'
import {
  CredentialsRepository,
  CredentialType,
} from '../data/CredentialsRepository'
import { AppError } from 'src/libs/errors/AppError'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly credentialsRepository: CredentialsRepository
  ) {}

  async list({ from, size }: { from: number; size: number }) {
    const count = await this.usersRepository.count()
    const users = await this.usersRepository.list({
      from,
      size,
    })

    return {
      users,
      total: count,
    }
  }

  async get({ userId }: { userId: string }) {
    const user = await this.usersRepository.findBy({
      id: userId,
    })

    if (!user) {
      throw new AppError({
        message: `User with id "${userId}" not found`,
        code: 'repository.not_found',
        status: 404,
        context: { userId },
      })
    }

    return user
  }

  async getByEmail({ email }: { email: string }) {
    const user = await this.usersRepository.findBy({
      email,
    })

    if (!user) {
      throw new AppError({
        message: `User with email "${email}" not found`,
        code: 'repository.not_found',
        status: 404,
        context: { email },
      })
    }

    return user
  }

  async create({
    email,
    password,
    role,
  }: {
    email: string
    password: string
    role: 'user' | 'admin'
  }) {
    const existingUser = await this.usersRepository.findBy({
      email,
    })

    if (existingUser) {
      throw new AppError({
        message: `User with email "${email}" already exists`,
        code: 'api.validation.incoming_failed',
        status: 400,
        context: { email },
      })
    }

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const user = await this.usersRepository.create({
      email,
      role,
    })

    await this.credentialsRepository.create({
      userId: user.id,
      password: hashedPassword,
      type: 'token',
    })

    return user
  }

  async getCredential({
    type,
    userId,
  }: {
    type: CredentialType
    userId: string
  }) {
    const credential = await this.credentialsRepository.findBy({
      userId,
      type,
    })

    if (!credential) {
      throw new AppError({
        message: `Credential with type "${type}" not found for user "${userId}"`,
        code: 'repository.not_found',
        status: 404,
        context: { userId, type },
      })
    }

    return credential
  }
}
