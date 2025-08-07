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

describe('EventsController.delete', () => {
  let pool: PostgresORM
  let baseApiClient: ApiClient
  let adminApiClient: ApiClient
  let userApiClient: ApiClient
  let eventsRepository: EventsRepository
  let adminUser: User
  let regularUser: User
  let testEvent: Event

  beforeAll(async () => {
    pool = getPoolORM()
    eventsRepository = new EventsRepository()
  })

  afterAll(async () => {
    await closePool()
  })

  beforeEach(async () => {
    await truncateTables(pool, [EventsTable, CredentialsTable, UsersTable])

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
      name: 'Event to Delete',
      date: new Date('2025-07-15T19:00:00Z'),
      address: '123 Delete Street',
      city: 'Paris',
      country: 'France',
      type: 'concert',
      priceAmount: '50.00',
      priceCurrency: 'EUR',
      isFree: false,
      description: 'This event will be deleted',
      imageUrl: 'https://example.com/delete.jpg',
    })
  })

  describe('DELETE /events/:id', () => {
    it('should delete event successfully as admin', async () => {
      // Verify event exists
      const existingEvent = await eventsRepository.findBy({ id: testEvent.id })
      expect(existingEvent).toBeTruthy()

      // Delete the event
      const response = await adminApiClient.DELETE('/events/{id}', {
        params: {
          path: { id: testEvent.id },
        },
      })

      // Should return 204 No Content
      expect(response.response.status).toBe(204)

      // Verify event is deleted from database
      const deletedEvent = await eventsRepository.findBy({ id: testEvent.id })
      expect(deletedEvent).toBeNull()
    })

    it('should return 404 for non-existent event', async () => {
      const nonExistentId = '42424242-4242-4242-4242-424242424242'

      await expect(
        adminApiClient.DELETE('/events/{id}', {
          params: {
            path: { id: nonExistentId },
          },
        })
      ).rejects.toMatchObject({
        code: 'repository.not_found',
      })
    })

    it('should deny access for regular users', async () => {
      await expect(
        userApiClient.DELETE('/events/{id}', {
          params: {
            path: { id: testEvent.id },
          },
        })
      ).rejects.toMatchObject({
        code: 'security.access_denied',
      })

      // Verify event still exists
      const existingEvent = await eventsRepository.findBy({ id: testEvent.id })
      expect(existingEvent).toBeTruthy()
    })

    it('should require authentication', async () => {
      await expect(
        baseApiClient.DELETE('/events/{id}', {
          params: {
            path: { id: testEvent.id },
          },
        })
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })

      // Verify event still exists
      const existingEvent = await eventsRepository.findBy({ id: testEvent.id })
      expect(existingEvent).toBeTruthy()
    })

    it('should handle invalid UUID format', async () => {
      await expect(
        adminApiClient.DELETE('/events/{id}', {
          params: {
            path: { id: 'invalid-uuid' },
          },
        })
      ).rejects.toMatchObject({
        code: 'repository.query_failed',
      })
    })
  })
})