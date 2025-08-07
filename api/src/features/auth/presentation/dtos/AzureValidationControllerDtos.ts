import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class AzureTokenValidationDto {
  @ApiProperty({
    description: 'Azure access token',
    example: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...',
    required: true,
  })
  @IsString()
  accessToken: string
}

export class AzureUserDto {
  @ApiProperty({ description: 'User ID', type: String })
  @IsString()
  id: string

  @ApiProperty({ description: 'User email', type: String })
  @IsString()
  email: string

  @ApiProperty({ description: 'User role', type: String })
  @IsString()
  role: string
}

export class AzureTokenValidationResponseDto {
  @ApiProperty({
    description: 'Whether the validation was successful',
    type: Boolean,
  })
  @IsBoolean()
  success: boolean

  @ApiProperty({
    description: 'JWT token for the application',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  jwtToken?: string

  @ApiProperty({
    description: 'User information',
    type: () => AzureUserDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => AzureUserDto)
  @IsOptional()
  user?: AzureUserDto

  @ApiProperty({
    description: 'Error message if validation failed',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  error?: string
}
