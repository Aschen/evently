import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { UserDto } from 'src/features/users/presentation/dtos/UserDto'

export class LoginWithPasswordParamsDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'john.doe@example.com',
    type: String,
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'Password of the user',
    example: 'securePassword123',
    type: String,
  })
  @IsString()
  password: string

  @ApiProperty({
    description:
      'Whether to return the token in the response. An error will be thrown if no origin header is provided and returnToken is false',
    type: Boolean,
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  returnToken?: boolean
}

export class LoginWithPasswordResponseDto {
  @ApiProperty({
    description:
      'JWT token for authentication. Only returned if returnToken is true',
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsOptional()
  token?: string
}

export class CurrentUserResponseDTO {
  @ApiProperty({
    description: 'User information',
    type: () => UserDto,
    nullable: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  user?: UserDto
}
