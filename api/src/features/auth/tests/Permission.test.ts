import { type ApiClient, createApiClient } from '@evently/api-client'
import {
  type PostgresORM,
  getPoolORM,
  closePool,
} from 'src/libs/database/PostgresPool'
import { type User, UsersRepository } from '../../users/data/UsersRepository'
import { UsersTable } from '../../users/data/UsersTable'
import { createUser } from '../../users/tests/helpers/usersFactory'
import { truncateTables } from 'src/libs/database/tests/helpers/tables'

describe.skip('Permission System', () => {
  let pool: PostgresORM
  let baseApiClient: ApiClient
  let adminApiClient: ApiClient
  let userApiClient: ApiClient
  let usersRepository: UsersRepository
  let adminUser: User
  let regularUser: User

  beforeAll(async () => {
    usersRepository = new UsersRepository()
    pool = getPoolORM()
  })

  afterAll(async () => {
    await closePool()
  })

  beforeEach(async () => {
    await truncateTables(pool, [UsersTable])

    // Create base API client for authentication
    baseApiClient = createApiClient({
      url: 'http://localhost:4000',
    })

    // Create test users
    adminUser = await createUser({
      email: 'admin@example.com',
      password: 'password',
      role: 'admin',
    })

    regularUser = await createUser({
      email: 'user@example.com',
      password: 'password',
      role: 'user',
    })

    // Get JWT tokens and create authenticated API clients
    const adminLoginResponse = await baseApiClient.POST('/auth/login', {
      body: {
        email: 'admin@example.com',
        password: 'password',
        returnToken: true,
      },
    })
    const adminJwt = adminLoginResponse.data!.token

    const userLoginResponse = await baseApiClient.POST('/auth/login', {
      body: {
        email: 'user@example.com',
        password: 'password',
        returnToken: true,
      },
    })
    const userJwt = userLoginResponse.data!.token

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

  describe('Role-based authorization', () => {
    describe('Admin-only endpoints', () => {
      it('should allow admin access to admin-only endpoint', async () => {
        const response = await adminApiClient.GET('/test/admin-only' as any, {})

        expect(response.response.status).toBe(200)
        expect(response.data).toEqual({ result: 'Admin access granted' })
      })

      it('should deny user access to admin-only endpoint', async () => {
        await expect(
          userApiClient.GET('/test/admin-only' as any, {})
        ).rejects.toMatchObject({
          code: 'security.access_denied',
        })
      })

      it('should deny unauthenticated access to admin-only endpoint', async () => {
        await expect(
          baseApiClient.GET('/test/admin-only' as any, {})
        ).rejects.toMatchObject({
          code: 'security.missing_token',
        })
      })
    })

    describe('User and admin endpoints', () => {
      it('should allow admin access to user-and-admin endpoint', async () => {
        const response = await adminApiClient.GET(
          '/test/user-and-admin' as any,
          {}
        )

        expect(response.response.status).toBe(200)
        expect(response.data).toEqual({
          result: 'User or admin access granted',
        })
      })

      it('should allow user access to user-and-admin endpoint', async () => {
        const response = await userApiClient.GET(
          '/test/user-and-admin' as any,
          {}
        )

        expect(response.response.status).toBe(200)
        expect(response.data).toEqual({
          result: 'User or admin access granted',
        })
      })

      it('should deny unauthenticated access to user-and-admin endpoint', async () => {
        await expect(
          baseApiClient.GET('/test/user-and-admin' as any, {})
        ).rejects.toMatchObject({
          code: 'security.missing_token',
        })
      })
    })

    describe('Endpoints without role restrictions', () => {
      it('should allow admin access to permission endpoint (no role restriction)', async () => {
        const response = await adminApiClient.GET('/test/permission' as any, {})

        expect(response.response.status).toBe(200)
        expect(response.data).toEqual({ result: 'OK' })
      })

      it('should allow user access to permission endpoint (no role restriction)', async () => {
        const response = await userApiClient.GET('/test/permission' as any, {})

        expect(response.response.status).toBe(200)
        expect(response.data).toEqual({ result: 'OK' })
      })

      it('should deny unauthenticated access to permission endpoint', async () => {
        await expect(
          baseApiClient.GET('/test/permission' as any, {})
        ).rejects.toMatchObject({
          code: 'security.missing_token',
        })
      })
    })
  })

  describe('Real API endpoints with role-based authorization', () => {
    describe('Users endpoint', () => {
      it('should allow admin to create users', async () => {
        const response = await adminApiClient.POST('/users', {
          body: {
            email: 'newuser@example.com',
            password: 'password123',
            role: 'user',
          },
        })

        expect(response.response.status).toBe(201)
        expect(response.data).toMatchObject({
          user: {
            email: 'newuser@example.com',
            role: 'user',
          },
        })
      })

      it('should deny user from creating users', async () => {
        await expect(
          userApiClient.POST('/users', {
            body: {
              email: 'newuser@example.com',
              password: 'password123',
              role: 'user',
            },
          })
        ).rejects.toMatchObject({
          code: 'security.access_denied',
        })
      })

      it('should allow admin to list users', async () => {
        const response = await adminApiClient.GET('/users')

        expect(response.response.status).toBe(200)
        expect(response.data).toMatchObject({
          users: expect.any(Array),
          total: expect.any(Number),
        })
      })

      it('should allow user to list users', async () => {
        const response = await userApiClient.GET('/users')

        expect(response.response.status).toBe(200)
        expect(response.data).toMatchObject({
          users: expect.any(Array),
          total: expect.any(Number),
        })
      })

      it('should allow admin to get user by id', async () => {
        const response = await adminApiClient.GET('/users/{id}', {
          params: {
            path: { id: regularUser.id },
          },
        })

        expect(response.response.status).toBe(200)
        expect(response.data).toMatchObject({
          user: {
            id: regularUser.id,
            email: regularUser.email,
            role: regularUser.role,
          },
        })
      })

      it('should allow user to get user by id', async () => {
        const response = await userApiClient.GET('/users/{id}', {
          params: {
            path: { id: adminUser.id },
          },
        })

        expect(response.response.status).toBe(200)
        expect(response.data).toMatchObject({
          user: {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
          },
        })
      })
    })
  })

  describe('Authentication errors', () => {
    it('should deny access when no JWT token is provided', async () => {
      await expect(
        baseApiClient.GET('/test/permission' as any, {})
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })

    it('should deny access when invalid JWT token is provided', async () => {
      const invalidApiClient = createApiClient({
        url: 'http://localhost:4000',
        token: 'invalid-token',
      })

      await expect(
        invalidApiClient.GET('/test/permission' as any, {})
      ).rejects.toMatchObject({
        code: 'security.invalid_token',
      })
    })

    it('should deny access when authorization header is malformed', async () => {
      await expect(
        baseApiClient.GET('/test/permission' as any, {
          headers: {
            Authorization: 'InvalidFormat',
          },
        })
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })
  })
})
