import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsUUID } from 'class-validator'

export class UserDto {
  @ApiProperty({ description: 'User ID', type: String, example: '123' })
  @IsUUID()
  id: string

  @ApiProperty({
    description: 'Email of the user',
    example: 'john.doe@example.com',
    type: String,
    nullable: false,
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'Role name the user has',
    enum: ['admin', 'user'],
    type: String,
  })
  @IsEnum(['admin', 'user'])
  role: 'admin' | 'user'
}
