import { type ApiClient, createApiClient } from '@evently/api-client'
import assert from 'node:assert'
import {
  type PostgresORM,
  getPoolORM,
  closePool,
} from 'src/libs/database/PostgresPool'
import { type Event, EventsRepository } from '../data/EventsRepository'
import { EventsTable } from '../data/EventsTable'
import { createUser } from 'src/features/users/tests/helpers/usersFactory'
import { truncateTables } from 'src/libs/database/tests/helpers/tables'
import { UsersTable } from 'src/features/users/data/UsersTable'
import { CredentialsTable } from 'src/features/users/data/CredentialsTable'
import type { User } from 'src/features/users/data/UsersRepository'
import { foundOrThrow } from 'src/libs/database/helpers/database-helpers'
import { UserEventFavoritesTable } from '../data/UserEventFavoritesTable'
import { UserEventFavoritesRepository } from '../data/UserEventFavoritesRepository'

describe('EventsController.addToFavorites', () => {
  let pool: PostgresORM
  let baseApiClient: ApiClient
  let adminApiClient: ApiClient
  let userApiClient: ApiClient
  let eventsRepository: EventsRepository
  let userEventFavoritesRepository: UserEventFavoritesRepository
  let adminUser: User
  let regularUser: User
  let testEvent: Event

  beforeAll(async () => {
    pool = getPoolORM()
    eventsRepository = new EventsRepository()
    userEventFavoritesRepository = new UserEventFavoritesRepository()
  })

  afterAll(async () => {
    await closePool()
  })

  beforeEach(async () => {
    await truncateTables(pool, [UserEventFavoritesTable, EventsTable, CredentialsTable, UsersTable])

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

    // Create a test event
    testEvent = await eventsRepository.create({
      name: 'Test Concert',
      date: new Date('2025-12-25T20:00:00Z'),
      address: '123 Music Street',
      city: 'Paris',
      country: 'France',
      type: 'concert',
      priceAmount: '50.00',
      priceCurrency: 'EUR',
      isFree: false,
      description: 'A great concert',
      imageUrl: 'https://example.com/concert.jpg',
    })
  })

  describe('POST /events/:id/favorites', () => {
    it('should successfully add event to favorites for authenticated user', async () => {
      /**
       * Business rules:
       *  - rule-favorites-authenticated-only
       *  - rule-favorites-valid-event
       */
      const response = await userApiClient.POST('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })

      expect(response.response.status).toBe(201)
      expect(response.data).toBeUndefined() // No response body

      // Verify favorite was created in database
      const favorite = await foundOrThrow(
        userEventFavoritesRepository.findBy({
          userId: regularUser.id,
          eventId: testEvent.id,
        })
      )

      expect(favorite).toMatchObject({
        id: expect.any(String),
        userId: regularUser.id,
        eventId: testEvent.id,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    })

    it('should be idempotent - adding same favorite twice returns success', async () => {
      /**
       * Business rules:
       *  - rule-favorites-idempotent-operations
       */
      // First add
      const response1 = await userApiClient.POST('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })
      expect(response1.response.status).toBe(201)

      // Second add (should be idempotent)
      const response2 = await userApiClient.POST('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })
      expect(response2.response.status).toBe(201)

      // Verify only one favorite exists
      const favorites = await userEventFavoritesRepository.list()
      expect(favorites).toHaveLength(1)
    })

    it('should return 404 when trying to favorite non-existent event', async () => {
      /**
       * Business rules:
       *  - rule-favorites-valid-event
       */
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

      await expect(
        userApiClient.POST('/events/{id}/favorites', {
          params: {
            path: { id: nonExistentId },
          },
        })
      ).rejects.toMatchObject({
        code: 'repository.not_found',
      })
    })

    it('should return 401 for unauthenticated requests', async () => {
      /**
       * Business rules:
       *  - rule-favorites-authenticated-only
       */
      await expect(
        baseApiClient.POST('/events/{id}/favorites', {
          params: {
            path: { id: testEvent.id },
          },
        })
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })

    it('should allow admin users to add favorites', async () => {
      const response = await adminApiClient.POST('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })

      expect(response.response.status).toBe(201)

      // Verify favorite was created for admin
      const favorite = await foundOrThrow(
        userEventFavoritesRepository.findBy({
          userId: adminUser.id,
          eventId: testEvent.id,
        })
      )

      expect(favorite.userId).toBe(adminUser.id)
    })

    it('should allow different users to favorite the same event', async () => {
      // User 1 adds favorite
      await userApiClient.POST('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })

      // Admin adds same event as favorite
      await adminApiClient.POST('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })

      // Verify both favorites exist
      const favorites = await userEventFavoritesRepository.list()
      expect(favorites).toHaveLength(2)
      
      const userIds = favorites.map(f => f.userId).sort()
      expect(userIds).toEqual([adminUser.id, regularUser.id].sort())
    })

  })
})