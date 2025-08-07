import { ApiProperty } from '@nestjs/swagger'
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator'

export class ServiceStatusDto {
  @ApiProperty({
    description: 'The status of the service',
    enum: ['healthy', 'unhealthy', 'unknown'],
  })
  @IsEnum(['healthy', 'unhealthy', 'unknown'])
  status: 'healthy' | 'unhealthy' | 'unknown'

  @ApiProperty({
    description: 'Error message if the service is unhealthy',
    required: false,
  })
  @IsString()
  @IsOptional()
  error?: string

  @ApiProperty({
    description: 'Additional details about the error',
    required: false,
  })
  @IsString()
  @IsOptional()
  details?: string

  @ApiProperty({
    description: 'Service response time in milliseconds',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  latency?: number
}

export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'The overall status of the system',
    enum: ['healthy', 'unhealthy'],
  })
  @IsEnum(['healthy', 'unhealthy'])
  status: 'healthy' | 'unhealthy'

  @ApiProperty({
    description: 'Status of individual services',
    type: 'object',
    additionalProperties: false,
  })
  @IsObject()
  services: {
    postgres: ServiceStatusDto
  }
}
