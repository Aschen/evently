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
import { UserEventFavoritesTable } from '../data/UserEventFavoritesTable'
import { UserEventFavoritesRepository } from '../data/UserEventFavoritesRepository'

describe('EventsController.removeFromFavorites', () => {
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

  describe('DELETE /events/:id/favorites', () => {
    it('should successfully remove event from favorites for authenticated user', async () => {
      /**
       * Business rules:
       *  - rule-favorites-authenticated-only
       */
      // First add the favorite
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvent.id,
      })

      // Remove the favorite
      const response = await userApiClient.DELETE('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })

      expect(response.response.status).toBe(204)
      expect(response.data).toBeUndefined() // No response body

      // Verify favorite was removed from database
      const favorite = await userEventFavoritesRepository.findBy({
        userId: regularUser.id,
        eventId: testEvent.id,
      })

      expect(favorite).toBeNull()
    })

    it('should be idempotent - removing non-existent favorite returns success', async () => {
      /**
       * Business rules:
       *  - rule-favorites-idempotent-operations
       */
      // Remove favorite that doesn't exist
      const response = await userApiClient.DELETE('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })

      expect(response.response.status).toBe(204)

      // Remove again (should still succeed)
      const response2 = await userApiClient.DELETE('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })

      expect(response2.response.status).toBe(204)
    })

    it('should return 401 for unauthenticated requests', async () => {
      /**
       * Business rules:
       *  - rule-favorites-authenticated-only
       */
      await expect(
        baseApiClient.DELETE('/events/{id}/favorites', {
          params: {
            path: { id: testEvent.id },
          },
        })
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })

    it('should allow admin users to remove favorites', async () => {
      // First add the favorite for admin
      await userEventFavoritesRepository.create({
        userId: adminUser.id,
        eventId: testEvent.id,
      })

      const response = await adminApiClient.DELETE('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })

      expect(response.response.status).toBe(204)

      // Verify favorite was removed for admin
      const favorite = await userEventFavoritesRepository.findBy({
        userId: adminUser.id,
        eventId: testEvent.id,
      })

      expect(favorite).toBeNull()
    })

    it('should only remove favorite for the authenticated user', async () => {
      /**
       * Business rules:
       *  - rule-favorites-user-isolation
       */
      // Add favorites for both users
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvent.id,
      })
      await userEventFavoritesRepository.create({
        userId: adminUser.id,
        eventId: testEvent.id,
      })

      // User removes their favorite
      await userApiClient.DELETE('/events/{id}/favorites', {
        params: {
          path: { id: testEvent.id },
        },
      })

      // Verify only user's favorite was removed
      const userFavorite = await userEventFavoritesRepository.findBy({
        userId: regularUser.id,
        eventId: testEvent.id,
      })
      expect(userFavorite).toBeNull()

      // Admin's favorite should still exist
      const adminFavorite = await userEventFavoritesRepository.findBy({
        userId: adminUser.id,
        eventId: testEvent.id,
      })
      expect(adminFavorite).not.toBeNull()
    })


    it('should succeed even when event does not exist', async () => {
      /**
       * Business rules:
       *  - rule-favorites-idempotent-operations
       */
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

      const response = await userApiClient.DELETE('/events/{id}/favorites', {
        params: {
          path: { id: nonExistentId },
        },
      })

      expect(response.response.status).toBe(204)
    })
  })
})