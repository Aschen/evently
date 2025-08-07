import { decimal, text, uuid, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { BaseSchema } from 'src/libs/database/data/BaseSchema'
import { timestampsFields } from 'src/libs/database/helpers/table-helpers'

export const eventTypeEnum = BaseSchema.enum('event_type', [
  'concert',
  'exhibition',
  'conference',
  'sport',
  'festival',
  'other'
])

export type EventType = (typeof eventTypeEnum.enumValues)[number]

export const EventsTable = BaseSchema.table(
  'events',
  {
    /**
     * Unique identifier for the event
     */
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * The name of the event
     */
    name: text('name').notNull(),

    /**
     * The date and time of the event
     */
    date: timestamp('date', { withTimezone: true }).notNull(),

    /**
     * Street address of the event
     */
    address: text('address').notNull(),

    /**
     * City where the event takes place
     */
    city: text('city').notNull(),

    /**
     * Country where the event takes place
     */
    country: text('country').notNull(),

    /**
     * Type of the event
     */
    type: eventTypeEnum('type').notNull(),

    /**
     * Price amount for the event (0 for free events)
     */
    priceAmount: decimal('price_amount', { precision: 10, scale: 2 }).notNull(),

    /**
     * Currency code for the price
     */
    priceCurrency: text('price_currency').notNull().default('EUR'),

    /**
     * Indicates if the event is free
     */
    isFree: boolean('is_free').notNull(),

    /**
     * Description of the event
     */
    description: text('description'),

    /**
     * URL to the event image
     */
    imageUrl: text('image_url'),

    ...timestampsFields(),
  },
  (events) => [
    index('idx_events_date').on(events.date),
    index('idx_events_type').on(events.type),
    index('idx_events_name').on(events.name),
    index('idx_events_city_country').on(events.city, events.country),
  ]
)