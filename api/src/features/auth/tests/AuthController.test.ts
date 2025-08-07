import { type ApiClient, createApiClient } from '@evently/api-client'
import assert from 'node:assert'
import {
  type PostgresORM,
  getPoolORM,
  closePool,
} from 'src/libs/database/PostgresPool'
import { type User, UsersRepository } from '../../users/data/UsersRepository'
import { UsersTable } from '../../users/data/UsersTable'
import { createUser } from '../../users/tests/helpers/usersFactory'
import { truncateTables } from 'src/libs/database/tests/helpers/tables'
import {
  LoginWithPasswordResponseDto,
  CurrentUserResponseDTO,
} from '../presentation/dtos/AuthControllerDtos'

describe('AuthController', () => {
  let pool: PostgresORM
  let user: User
  let jwt: string
  let apiClient: ApiClient
  let usersRepository: UsersRepository

  beforeAll(async () => {
    usersRepository = new UsersRepository()

    pool = getPoolORM()
  })

  afterAll(async () => {
    await closePool()
  })

  beforeEach(async () => {
    await truncateTables(pool, [UsersTable])

    apiClient = createApiClient({
      url: 'http://localhost:4000',
    })

    user = await createUser({
      email: 'aschen@example.com',
      password: 'password',
      role: 'user',
    })
  })

  describe('POST /auth/login', () => {
    it('should login with email and password', async () => {
      const response = await apiClient.POST('/auth/login', {
        body: {
          email: 'aschen@example.com',
          password: 'password',
          returnToken: true,
        },
      })

      expect(response.data).toMatchObject<LoginWithPasswordResponseDto>({
        token: expect.any(String),
      })
    })

    it('should return error for invalid password', async () => {
      await expect(
        apiClient.POST('/auth/login', {
          body: {
            email: 'aschen@example.com',
            password: 'wrongpassword',
            returnToken: true,
          },
        })
      ).rejects.toMatchObject({
        code: 'security.invalid_credentials',
      })
    })

    it('should return error for non-existent user', async () => {
      await expect(
        apiClient.POST('/auth/login', {
          body: {
            email: 'non-existent@example.com',
            password: 'password',
            returnToken: true,
          },
        })
      ).rejects.toMatchObject({
        code: 'repository.not_found',
      })
    })

    it('should not return token when returnToken is false and origin is provided', async () => {
      const response = await apiClient.POST('/auth/login', {
        body: {
          email: 'aschen@example.com',
          password: 'password',
          returnToken: false,
        },
        headers: {
          origin: 'http://example.com',
        },
      })

      expect(response.data).toEqual({})
    })

    it('should return error when returnToken is false and no origin header', async () => {
      await expect(
        apiClient.POST('/auth/login', {
          body: {
            email: 'aschen@example.com',
            password: 'password',
            returnToken: false,
          },
        })
      ).rejects.toMatchObject({
        code: 'security.invalid_origin',
      })
    })

    it('should return token by default when returnToken is not specified', async () => {
      const response = await apiClient.POST('/auth/login', {
        body: {
          email: 'aschen@example.com',
          password: 'password',
        },
      })

      expect(response.data).toMatchObject<LoginWithPasswordResponseDto>({
        token: expect.any(String),
      })
    })
  })

  describe('GET /auth/current-user', () => {
    it('should return user info when valid token is provided', async () => {
      const loginResponse = await apiClient.POST('/auth/login', {
        body: {
          email: 'aschen@example.com',
          password: 'password',
          returnToken: true,
        },
      })

      assert(loginResponse.data)

      const jwt = loginResponse.data.token

      const response = await apiClient.GET('/auth/current-user', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      })

      expect(response.data).toMatchObject<CurrentUserResponseDTO>({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      })
    })

    it('should return empty object when no token is provided', async () => {
      const response = await apiClient.GET('/auth/current-user')

      expect(response.data).toEqual({})
    })

    it('should return empty object when malformed authorization header', async () => {
      const response = await apiClient.GET('/auth/current-user', {
        headers: {
          Authorization: 'InvalidFormat',
        },
      })

      expect(response.data).toEqual({})
    })
  })
})
