import { createUser } from 'src/features/users/tests/helpers/usersFactory'
import { createApiClient } from '@evently/api-client'

const API_BASE_URL = 'http://localhost:4000'

interface CreatedUsers {
  regularUser: { email: string; id: string }
  adminUser: { email: string; id: string }
}

async function createUsers(): Promise<CreatedUsers | null> {
  try {
    console.log('👤 Creating users...')

    const regularUser = await createUser({
      email: 'user@example.com',
      password: 'password',
      role: 'user',
    })

    const adminUser = await createUser({
      email: 'admin@example.com',
      password: 'password',
      role: 'admin',
    })

    console.log(`✅ Created user: ${regularUser.email}`)
    console.log(`✅ Created admin: ${adminUser.email}`)

    return { regularUser, adminUser }
  } catch (error) {
    console.error('❌ Failed to create users:', error)
    return null
  }
}

async function createEvents(adminToken: string): Promise<void> {
  try {
    console.log('🎭 Creating events...')

    const adminApiClient = createApiClient({
      url: API_BASE_URL,
      token: adminToken,
    })

    const events = [
      {
        name: 'Tech Conference San Francisco 2026',
        date: '2026-03-15T09:00:00Z',
        address: '123 Tech Street',
        city: 'San Francisco',
        country: 'USA',
        type: 'conference' as const,
        price: {
          amount: 299.99,
          currency: 'USD',
        },
        description:
          'Join industry leaders for the latest in technology trends and innovation.',
        imageUrl: 'https://example.com/tech-conference.jpg',
      },
      {
        name: 'Jazz Festival New York',
        date: '2026-06-20T19:00:00Z',
        address: '456 Music Avenue',
        city: 'New York',
        country: 'USA',
        type: 'festival' as const,
        price: {
          amount: 75.5,
          currency: 'USD',
        },
        description:
          'Experience the best jazz musicians from around the world.',
        imageUrl: 'https://example.com/jazz-festival.jpg',
      },
      {
        name: 'Modern Art Exhibition',
        date: '2026-04-10T10:00:00Z',
        address: '789 Gallery Road',
        city: 'Los Angeles',
        country: 'USA',
        type: 'exhibition' as const,
        price: {
          amount: 25.0,
          currency: 'USD',
        },
        description:
          'Discover contemporary artists and their groundbreaking works.',
      },
      {
        name: 'Lakers vs Warriors',
        date: '2026-02-28T20:00:00Z',
        address: '1111 Arena Boulevard',
        city: 'Los Angeles',
        country: 'USA',
        type: 'sport' as const,
        price: {
          amount: 150.0,
          currency: 'USD',
        },
        description: 'Epic basketball showdown between two legendary teams.',
        imageUrl: 'https://example.com/basketball-game.jpg',
      },
      {
        name: 'Rock Concert Chicago',
        date: '2026-05-05T21:00:00Z',
        address: '555 Concert Hall Street',
        city: 'Chicago',
        country: 'USA',
        type: 'concert' as const,
        price: {
          amount: 89.99,
          currency: 'USD',
        },
        description: 'An unforgettable night of rock music with top bands.',
      },
      {
        name: 'Community Food Festival',
        date: '2026-07-04T12:00:00Z',
        address: '321 Park Avenue',
        city: 'Austin',
        country: 'USA',
        type: 'festival' as const,
        price: {
          amount: 0,
          currency: 'USD',
        },
        description: 'Free community event celebrating local food and culture.',
      },
      {
        name: 'Startup Networking Event',
        date: '2026-04-25T18:00:00Z',
        address: '999 Innovation Drive',
        city: 'Seattle',
        country: 'USA',
        type: 'other' as const,
        price: {
          amount: 45.0,
          currency: 'USD',
        },
        description:
          'Connect with entrepreneurs and investors in the startup ecosystem.',
      },
      {
        name: 'Photography Workshop',
        date: '2026-08-12T14:00:00Z',
        address: '777 Creative Plaza',
        city: 'Denver',
        country: 'USA',
        type: 'other' as const,
        price: {
          amount: 120.0,
          currency: 'USD',
        },
        description:
          'Learn advanced photography techniques from professional photographers.',
        imageUrl: 'https://example.com/photography-workshop.jpg',
      },
    ]

    for (const eventData of events) {
      const response = await adminApiClient.POST('/events', {
        body: eventData,
      })

      if (response.data) {
        console.log(`✅ Created event: ${eventData.name} in ${eventData.city}`)
      }
    }

    console.log(`🎉 Successfully created ${events.length} events!`)
  } catch (error) {
    console.error('❌ Failed to create events:', error)
    throw error
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  // Create users
  const users = await createUsers()
  if (!users) {
    console.error('❌ Failed to create users, aborting seeding')
    return
  }

  // Get admin token for creating events
  const baseApiClient = createApiClient({
    url: API_BASE_URL,
  })

  const adminLoginResponse = await baseApiClient.POST('/auth/login', {
    body: {
      email: users.adminUser.email,
      password: 'password',
      returnToken: true,
    },
  })

  if (!adminLoginResponse.data?.token) {
    console.error('❌ Failed to get admin token, aborting event creation')
    return
  }

  // Create events
  await createEvents(adminLoginResponse.data.token)

  console.log('🎉 Database seeding completed!')
  console.log('\n📊 Summary:')
  console.log('- 2 users created (1 admin, 1 regular user)')
  console.log('- 8 events created across various US cities')
  console.log('- Mix of free and paid events with different types')
}

// Export the seed function for external usage
export { seedDatabase }

// Run the seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}
