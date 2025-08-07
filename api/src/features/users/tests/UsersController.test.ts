import { type ApiClient, createApiClient } from '@evently/api-client'
import assert from 'node:assert'
import {
  type PostgresORM,
  getPoolORM,
  closePool,
} from 'src/libs/database/PostgresPool'
import { type User, UsersRepository } from '../data/UsersRepository'
import { UsersTable } from '../data/UsersTable'
import {
  CredentialsRepository,
  type Credential,
} from '../data/CredentialsRepository'
import { CredentialsTable } from '../data/CredentialsTable'
import { createUser } from './helpers/usersFactory'
import { truncateTables } from 'src/libs/database/tests/helpers/tables'
import {
  UsersListResponseDto,
  UserGetResponseDto,
  UsersCreateResponseDto,
} from '../presentation/dtos/UsersControllerDtos'
import { foundOrThrow } from 'src/libs/database/helpers/database-helpers'

describe('UsersController', () => {
  let pool: PostgresORM
  let baseApiClient: ApiClient
  let adminApiClient: ApiClient
  let userApiClient: ApiClient
  let usersRepository: UsersRepository
  let credentialsRepository: CredentialsRepository
  let adminUser: User
  let regularUser: User

  beforeAll(async () => {
    pool = getPoolORM()
    usersRepository = new UsersRepository()
    credentialsRepository = new CredentialsRepository()
  })

  afterAll(async () => {
    await closePool()
  })

  beforeEach(async () => {
    await truncateTables(pool, [CredentialsTable, UsersTable])

    baseApiClient = createApiClient({
      url: 'http://localhost:4000',
    })

    // Create admin user for testing
    adminUser = await createUser({
      email: 'admin@example.com',
      password: 'password',
      role: 'admin',
    })

    // Create regular user for testing
    regularUser = await createUser({
      email: 'user@example.com',
      password: 'password',
      role: 'user',
    })

    // Get JWT tokens for both users
    const adminLoginResponse = await baseApiClient.POST('/auth/login', {
      body: {
        email: adminUser.email,
        password: 'password',
        returnToken: true,
      },
    })
    assert(adminLoginResponse.data)
    const adminJwt = adminLoginResponse.data.token

    const userLoginResponse = await baseApiClient.POST('/auth/login', {
      body: {
        email: regularUser.email,
        password: 'password',
        returnToken: true,
      },
    })
    assert(userLoginResponse.data)
    const userJwt = userLoginResponse.data.token

    // Create authenticated API clients
    adminApiClient = createApiClient({
      url: 'http://localhost:4000',
      token: adminJwt,
    })

    userApiClient = createApiClient({
      url: 'http://localhost:4000',
      token: userJwt,
    })
  })

  describe('GET /users', () => {
    it('should return list of users with default pagination', async () => {
      const response = await adminApiClient.GET('/users')

      expect(response.data).toMatchObject<UsersListResponseDto>({
        users: expect.arrayContaining([
          expect.objectContaining({
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
          }),
          expect.objectContaining({
            id: regularUser.id,
            email: regularUser.email,
            role: regularUser.role,
          }),
        ]),
        total: expect.any(Number),
      })

      assert(response.data)
      expect(response.data.users).toHaveLength(2)
    })

    it('should require authentication', async () => {
      await expect(baseApiClient.GET('/users')).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })
  })

  describe('GET /users/:id', () => {
    it('should return single user by id', async () => {
      const response = await adminApiClient.GET('/users/{id}', {
        params: {
          path: { id: regularUser.id },
        },
      })

      expect(response.data).toMatchObject<UserGetResponseDto>({
        user: {
          id: regularUser.id,
          email: regularUser.email,
          role: regularUser.role,
        },
      })
    })

    it('should return 404 for non-existent user', async () => {
      await expect(
        adminApiClient.GET('/users/{id}', {
          params: {
            path: { id: '42424242-4242-4242-4242-424242424242' },
          },
        })
      ).rejects.toMatchObject({
        code: 'repository.not_found',
      })
    })

    it('should require authentication', async () => {
      await expect(
        baseApiClient.GET('/users/{id}', {
          params: {
            path: { id: regularUser.id },
          },
        })
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })
  })

  describe('POST /users', () => {
    it('should create new user successfully', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user' as const,
      }

      const response = await adminApiClient.POST('/users', {
        body: newUserData,
      })

      expect(response.data).toMatchObject<UsersCreateResponseDto>({
        user: {
          id: expect.any(String),
          email: newUserData.email,
          role: newUserData.role,
        },
      })

      // Verify user was created in database
      const createdUser = await foundOrThrow(
        usersRepository.findBy({
          email: newUserData.email,
        })
      )
      expect(createdUser).toMatchObject<User>({
        id: expect.any(String),
        email: newUserData.email,
        role: newUserData.role,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })

      // Verify credentials were created
      const credentials = await credentialsRepository.findBy({
        userId: createdUser!.id,
        type: 'token',
      })
      expect(credentials).toMatchObject<Credential>({
        id: expect.any(String),
        type: 'token',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        userId: createdUser.id,
        password: expect.any(String),
      })
    })

    it('should return error for duplicate email', async () => {
      await expect(
        adminApiClient.POST('/users', {
          body: {
            email: regularUser.email,
            password: 'password123',
            role: 'user',
          },
        })
      ).rejects.toMatchObject({
        code: 'api.validation.incoming_failed',
      })

      // Verify no additional user was created
      const users = await usersRepository.list({ from: 0, size: 100 })
      expect(users).toHaveLength(2) // Only the initial admin and regular user
    })

    it('should validate email format', async () => {
      await expect(
        adminApiClient.POST('/users', {
          body: {
            email: 'invalid-email',
            password: 'password123',
            role: 'user',
          },
        })
      ).rejects.toMatchObject({
        code: 'api.validation.incoming_failed',
      })
    })

    it('should validate password length', async () => {
      await expect(
        adminApiClient.POST('/users', {
          body: {
            email: 'test@example.com',
            password: 'short',
            role: 'user',
          },
        })
      ).rejects.toMatchObject({
        code: 'api.validation.incoming_failed',
      })
    })

    it('should validate role enum', async () => {
      await expect(
        adminApiClient.POST('/users', {
          body: {
            email: 'test@example.com',
            password: 'password123',
            role: 'invalid-role' as any,
          },
        })
      ).rejects.toMatchObject({
        code: 'api.validation.incoming_failed',
      })
    })

    it('should require authentication', async () => {
      await expect(
        baseApiClient.POST('/users', {
          body: {
            email: 'test@example.com',
            password: 'password123',
            role: 'user',
          },
        })
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })

    it('should require proper permissions', async () => {
      await expect(
        userApiClient.POST('/users', {
          body: {
            email: 'test@example.com',
            password: 'password123',
            role: 'user',
          },
        })
      ).rejects.toMatchObject({
        code: 'security.access_denied',
      })
    })

    it('should create admin user when role is admin', async () => {
      const newAdminData = {
        email: 'newadmin@example.com',
        password: 'password123',
        role: 'admin' as const,
      }

      const response = await adminApiClient.POST('/users', {
        body: newAdminData,
      })

      expect(response.data).toMatchObject<UsersCreateResponseDto>({
        user: {
          id: expect.any(String),
          email: newAdminData.email,
          role: 'admin',
        },
      })

      // Verify admin user was created in database
      const createdAdmin = await usersRepository.findBy({
        email: newAdminData.email,
      })
      expect(createdAdmin).toBeTruthy()
      expect(createdAdmin?.role).toBe('admin')
    })
  })
})
