import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsNumber, IsString, IsEnum, IsOptional, ValidateNested } from 'class-validator'
import { eventTypeEnum, EventType } from '../../data/EventsTable'

export class EventLocationDto {
  @ApiProperty({
    description: 'Street address of the event',
    example: '123 Main Street',
    type: String,
  })
  @IsString()
  address: string

  @ApiProperty({
    description: 'City where the event takes place',
    example: 'Paris',
    type: String,
  })
  @IsString()
  city: string

  @ApiProperty({
    description: 'Country where the event takes place',
    example: 'France',
    type: String,
  })
  @IsString()
  country: string
}

export class EventPriceDto {
  @ApiProperty({
    description: 'Price amount for the event',
    example: 25.50,
    type: Number,
  })
  @IsNumber()
  amount: number

  @ApiProperty({
    description: 'Currency code for the price',
    example: 'EUR',
    type: String,
  })
  @IsString()
  currency: string

  @ApiProperty({
    description: 'Indicates if the event is free',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  isFree: boolean
}

export class EventDto {
  @ApiProperty({
    description: 'Unique identifier for the event',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    type: String,
  })
  @IsString()
  id: string

  @ApiProperty({
    description: 'The name of the event',
    example: 'Summer Music Festival',
    type: String,
  })
  @IsString()
  name: string

  @ApiProperty({
    description: 'The date and time of the event',
    example: '2025-07-15T19:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsString()
  date: string

  @ApiProperty({ type: () => EventLocationDto })
  @ValidateNested()
  @Type(() => EventLocationDto)
  location: EventLocationDto

  @ApiProperty({
    description: 'Type of the event',
    example: 'concert',
    enum: eventTypeEnum.enumValues,
    type: String,
  })
  @IsEnum(eventTypeEnum.enumValues)
  type: EventType

  @ApiProperty({ type: () => EventPriceDto })
  @ValidateNested()
  @Type(() => EventPriceDto)
  price: EventPriceDto

  @ApiProperty({
    description: 'Description of the event',
    example: 'A fantastic outdoor music festival featuring local and international artists.',
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description: string | null

  @ApiProperty({
    description: 'URL to the event image',
    example: 'https://example.com/event-image.jpg',
    type: String,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  imageUrl: string | null

  @ApiProperty({
    description: 'Indicates if the event is favorited by the current user',
    example: false,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isFavorited?: boolean
}