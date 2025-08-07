import {
  Injectable,
  Controller,
  Post,
  Get,
  Response,
  Request,
  Body,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  Response as ExpressResponse,
  Request as ExpressRequest,
  request,
} from 'express'
import { ApiValidatedResponse } from '../../../libs/api/decorators/ApiValidatedResponse'
import { JWT } from '../decorators/JWT'
import { VerifyJWT } from '../decorators/VerifyJWT'
import { AuthService } from '../services/AuthService'
import type { JWTPayload } from '../types/JWTPayload'
import {
  CurrentUserResponseDTO,
  LoginWithPasswordParamsDto,
  LoginWithPasswordResponseDto,
} from './dtos/AuthControllerDtos'
import { PublicApi } from 'src/libs/api/decorators/PublicApi'
import { UsersService } from 'src/features/users/services/UsersService'
import { AppError } from 'src/libs/errors/AppError'

@Injectable()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly authService: AuthService,
    protected readonly usersService: UsersService
  ) {}

  @Get('current-user')
  @ApiOperation({
    description:
      'Get the current user. If there is no logged user (header or cookie), it returns an empty object',
  })
  @ApiValidatedResponse({
    type: CurrentUserResponseDTO,
    description: 'Only if cookie is not set to true',
    status: 200,
  })
  @PublicApi()
  @VerifyJWT()
  async currentUser(
    @JWT() token?: JWTPayload
  ): Promise<CurrentUserResponseDTO> {
    if (!token) {
      return {}
    }

    const user = await this.usersService.get({ userId: token.userId })

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  }

  @Post('login')
  @ApiOperation({
    description: 'Login with email and password',
  })
  @ApiValidatedResponse({
    status: 200,
    description: 'Login successful',
    type: LoginWithPasswordResponseDto,
  })
  @PublicApi()
  async loginWithPassword(
    @Body() body: LoginWithPasswordParamsDto,
    @Request() request: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse
  ): Promise<LoginWithPasswordResponseDto> {
    const { token } = await this.authService.loginWithPassword({
      email: body.email,
      password: body.password,
    })

    if (body.returnToken === false && !request.headers['origin']) {
      throw new AppError({
        code: 'security.invalid_origin',
        status: 400,
        message: 'No origin header provided and token is not returned',
      })
    }

    if (request.headers['origin']) {
      const { name, domain } = this.authService.getCookieSpec(
        request.headers['origin']
      )

      res.cookie(name, token, {
        domain,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      })
    }

    if (body.returnToken === false) {
      return {}
    }

    return {
      token,
    }
  }

  @Post('logout')
  @ApiOperation({
    description: 'Delete the JWT from the cookies',
  })
  @PublicApi()
  async logout(
    @Request() request: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse
  ) {
    if (request.headers['origin']) {
      res.clearCookie(
        this.authService.getCookieSpec(request.headers['origin']).name
      )
    }
  }
}
