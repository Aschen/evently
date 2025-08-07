import { ApiProperty } from '@nestjs/swagger'
import { Type, Transform } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
  IsDateString,
  IsBoolean,
} from 'class-validator'
import { EventDto } from './EventDto'
import { eventTypeEnum, EventType } from '../../data/EventsTable'

// List endpoint DTOs
export class EventsListParamsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'Starting index',
    type: Number,
    required: false,
    default: 0,
  })
  from?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Page size',
    type: Number,
    required: false,
    default: 20,
    maximum: 100,
  })
  size?: number

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search term for event name or location',
    type: String,
    required: false,
    example: 'music festival',
  })
  search?: string

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Location text to filter by (will match address, city, or country)',
    type: String,
    required: false,
    example: 'Paris',
  })
  location?: string

  @IsOptional()
  @IsEnum(eventTypeEnum.enumValues)
  @ApiProperty({
    description: 'Event type to filter by',
    enum: eventTypeEnum.enumValues,
    type: String,
    required: false,
    example: 'concert',
  })
  type?: EventType

  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean()
  @ApiProperty({
    description: 'Filter events by free/paid status. True returns only free events, false returns only paid events',
    type: Boolean,
    required: false,
    example: true,
  })
  isFree?: boolean
}

export class EventsListResponseDto {
  @ApiProperty({ type: () => EventDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  @IsArray()
  events: EventDto[]

  @ApiProperty({
    description: 'Total number of events matching the criteria',
    type: Number,
    example: 100,
  })
  @IsInt()
  @Type(() => Number)
  total: number
}

// Locations endpoint DTOs
export class EventsLocationsParamsDto {
  @IsString()
  @MinLength(2)
  @ApiProperty({
    description:
      'Query string for location autocomplete (minimum 2 characters)',
    type: String,
    example: 'Par',
  })
  query: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Maximum number of suggestions',
    type: Number,
    required: false,
    default: 10,
    maximum: 50,
  })
  limit?: number
}

export class LocationSuggestionDto {
  @ApiProperty({
    description: 'Formatted display name for the location',
    example: '123 Main Street, Paris, France',
    type: String,
  })
  @IsString()
  displayName: string

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
    type: String,
  })
  @IsString()
  address: string

  @ApiProperty({
    description: 'City name',
    example: 'Paris',
    type: String,
  })
  @IsString()
  city: string

  @ApiProperty({
    description: 'Country name',
    example: 'France',
    type: String,
  })
  @IsString()
  country: string
}

export class EventsLocationsResponseDto {
  @ApiProperty({ type: () => LocationSuggestionDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => LocationSuggestionDto)
  @IsArray()
  suggestions: LocationSuggestionDto[]
}

// Create endpoint DTOs
export class EventPriceCreateDto {
  @ApiProperty({
    description: 'Price amount',
    example: 25.5,
    type: Number,
  })
  @IsNumber()
  amount: number

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
    type: String,
  })
  @IsString()
  currency: string
}

export class EventsCreateParamsDto {
  @ApiProperty({
    description: 'Event name',
    example: 'Summer Music Festival',
    type: String,
  })
  @IsString()
  name: string

  @ApiProperty({
    description: 'Event date and time',
    example: '2025-07-15T19:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  date: string

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
    type: String,
  })
  @IsString()
  address: string

  @ApiProperty({
    description: 'City',
    example: 'Paris',
    type: String,
  })
  @IsString()
  city: string

  @ApiProperty({
    description: 'Country',
    example: 'France',
    type: String,
  })
  @IsString()
  country: string

  @ApiProperty({
    description: 'Event type',
    enum: eventTypeEnum.enumValues,
    type: String,
    example: 'concert',
  })
  @IsEnum(eventTypeEnum.enumValues)
  type: EventType

  @ApiProperty({ type: () => EventPriceCreateDto })
  @ValidateNested()
  @Type(() => EventPriceCreateDto)
  price: EventPriceCreateDto

  @ApiProperty({
    description: 'Event description',
    type: String,
    required: false,
    example:
      'A fantastic outdoor music festival featuring local and international artists.',
  })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({
    description: 'Event image URL',
    type: String,
    required: false,
    example: 'https://example.com/event-image.jpg',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string
}

export class EventsCreateResponseDto {
  @ApiProperty({ type: () => EventDto })
  @ValidateNested()
  @Type(() => EventDto)
  event: EventDto
}

// Favorites endpoint DTOs
export class EventsFavoritesListResponseDto {
  @ApiProperty({ type: () => EventDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  @IsArray()
  events: EventDto[]

  @ApiProperty({
    description: 'Total number of favorite events',
    type: Number,
    example: 10,
  })
  @IsInt()
  @Type(() => Number)
  total: number
}

export class EventFavoriteGetResponseDto {
  @ApiProperty({ type: () => EventDto })
  @ValidateNested()
  @Type(() => EventDto)
  event: EventDto
}
