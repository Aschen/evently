import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator'
import { UserDto } from './UserDto'

export class UsersListParamsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'The index of the first element to return',
    type: 'number',
    required: false,
  })
  from = 0

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'The number of elements to return',
    type: 'number',
    required: false,
  })
  size = 10
}

export class UserGetResponseDto {
  @ApiProperty({ type: () => UserDto })
  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto
}

export class UsersListResponseDto {
  @ApiProperty({ type: () => UserDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => UserDto)
  @IsArray()
  users: UserDto[]

  @ApiProperty({
    description: 'Total number of users matching the criteria',
    type: Number,
    example: 100,
  })
  @IsInt()
  @Type(() => Number)
  total: number
}

export class UsersCreateParamsDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'john.doe@example.com',
    type: String,
    nullable: false,
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'Password of the user',
    example: 'securePassword123',
    type: String,
    nullable: false,
  })
  @IsString()
  @MinLength(8)
  password: string

  @ApiProperty({
    description: 'Role of the user',
    example: 'user',
    enum: ['user', 'admin'],
    type: String,
    nullable: false,
  })
  @IsEnum(['user', 'admin'])
  role: 'user' | 'admin'
}

export class UsersCreateResponseDto {
  @ApiProperty({ type: () => UserDto })
  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto
}
