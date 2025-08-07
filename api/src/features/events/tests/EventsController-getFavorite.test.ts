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
import { EventFavoriteGetResponseDto } from '../presentation/dtos/EventsControllerDtos'

describe('EventsController.getFavorite', () => {
  let pool: PostgresORM
  let baseApiClient: ApiClient
  let adminApiClient: ApiClient
  let userApiClient: ApiClient
  let eventsRepository: EventsRepository
  let userEventFavoritesRepository: UserEventFavoritesRepository
  let adminUser: User
  let regularUser: User
  let testEvent: Event
  let nonFavoritedEvent: Event

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

    // Create test events
    testEvent = await eventsRepository.create({
      name: 'Favorited Concert',
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

    nonFavoritedEvent = await eventsRepository.create({
      name: 'Not Favorited Event',
      date: new Date('2025-11-15T18:00:00Z'),
      address: '456 Other Street',
      city: 'Lyon',
      country: 'France',
      type: 'exhibition',
      priceAmount: '10.00',
      priceCurrency: 'EUR',
      isFree: false,
      description: 'An exhibition',
      imageUrl: 'https://example.com/exhibition.jpg',
    })
  })

  describe('GET /events/:id/favorite', () => {
    it('should successfully retrieve favorited event details', async () => {
      // First add the event to favorites
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvent.id,
      })

      const response = await userApiClient.GET('/events/{id}/favorite', {
        params: {
          path: { id: testEvent.id },
        },
      })

      assert(response.data)
      expect(response.data).toMatchObject<EventFavoriteGetResponseDto>({
        event: {
          id: testEvent.id,
          name: testEvent.name,
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/),
          location: {
            address: testEvent.address,
            city: testEvent.city,
            country: testEvent.country,
          },
          type: testEvent.type,
          price: {
            amount: parseFloat(testEvent.priceAmount),
            currency: testEvent.priceCurrency,
            isFree: testEvent.isFree,
          },
          description: testEvent.description,
          imageUrl: testEvent.imageUrl,
          isFavorited: true, // Should always be true for this endpoint
        },
      })
    })

    it('should return 404 when event is not in user favorites', async () => {
      // Event exists but is not favorited by user
      await expect(
        userApiClient.GET('/events/{id}/favorite', {
          params: {
            path: { id: nonFavoritedEvent.id },
          },
        })
      ).rejects.toMatchObject({
        code: 'repository.not_found',
        message: expect.stringContaining('not in your favorites'),
      })
    })

    it('should return 404 when event does not exist', async () => {
      const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

      await expect(
        userApiClient.GET('/events/{id}/favorite', {
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
        baseApiClient.GET('/events/{id}/favorite', {
          params: {
            path: { id: testEvent.id },
          },
        })
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })

    it('should only return event if favorited by the authenticated user', async () => {
      /**
       * Business rules:
       *  - rule-favorites-user-isolation
       */
      // Add favorite for admin user only
      await userEventFavoritesRepository.create({
        userId: adminUser.id,
        eventId: testEvent.id,
      })

      // Regular user should get 404
      await expect(
        userApiClient.GET('/events/{id}/favorite', {
          params: {
            path: { id: testEvent.id },
          },
        })
      ).rejects.toMatchObject({
        code: 'repository.not_found',
        message: expect.stringContaining('not in your favorites'),
      })

      // Admin should succeed
      const adminResponse = await adminApiClient.GET('/events/{id}/favorite', {
        params: {
          path: { id: testEvent.id },
        },
      })

      assert(adminResponse.data)
      expect(adminResponse.data.event.id).toBe(testEvent.id)
      expect(adminResponse.data.event.isFavorited).toBe(true)
    })


    it('should always return isFavorited as true for this endpoint', async () => {
      // Add favorite
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvent.id,
      })

      const response = await userApiClient.GET('/events/{id}/favorite', {
        params: {
          path: { id: testEvent.id },
        },
      })

      assert(response.data)
      // This endpoint only returns favorited events, so isFavorited is always true
      expect(response.data.event.isFavorited).toBe(true)
    })
  })
})