import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiValidatedResponse } from 'src/libs/api/decorators/ApiValidatedResponse'
import { Auth } from 'src/features/auth/decorators/Auth'
import { UsersService } from '../services/UsersService'
import {
  UsersListParamsDto,
  UsersListResponseDto,
  UserGetResponseDto,
  UsersCreateParamsDto,
  UsersCreateResponseDto,
} from './dtos/UsersControllerDtos'

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('')
  @ApiOperation({
    description: 'Use this API action to list users',
  })
  @ApiValidatedResponse({
    status: 200,
    description: 'List of users with their groups and connected accounts',
    type: UsersListResponseDto,
  })
  @Auth({
    apiAction: 'users:list',
    roles: ['admin', 'user'],
  })
  async list(
    @Query() query: UsersListParamsDto
  ): Promise<UsersListResponseDto> {
    return this.usersService.list({
      from: query.from,
      size: query.size,
    })
  }

  @Get(':id')
  @ApiOperation({
    description: 'Use this API action to get a single user',
  })
  @ApiValidatedResponse({
    status: 200,
    description: 'User with their groups and connected accounts',
    type: UserGetResponseDto,
  })
  @Auth({
    apiAction: 'users:get',
    roles: ['admin', 'user'],
  })
  async get(@Param('id') userId: string) {
    const user = await this.usersService.get({
      userId,
    })

    return { user }
  }

  @Post('')
  @ApiOperation({
    description: 'Use this API action to create a new user',
  })
  @ApiValidatedResponse({
    status: 201,
    description: 'User created successfully',
    type: UsersCreateResponseDto,
  })
  @Auth({
    apiAction: 'users:create',
    roles: ['admin'],
  })
  async create(@Body() body: UsersCreateParamsDto) {
    const user = await this.usersService.create({
      email: body.email,
      password: body.password,
      role: body.role,
    })

    return { user }
  }
}
