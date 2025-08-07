import { Injectable } from '@nestjs/common'
import { JwtService, JwtSignOptions } from '@nestjs/jwt'
import type { User } from 'src/features/users/data/UsersRepository'
import { AppError } from 'src/libs/errors/AppError'
import { Duration } from 'src/libs/utils/duration'
import { JWTPayload } from '../types/JWTPayload'
import * as bcrypt from 'bcrypt'
import { UsersService } from 'src/features/users/services/UsersService'

@Injectable()
export class AuthService {
  constructor(
    protected jwtService: JwtService,
    protected usersService: UsersService
  ) {}

  /**
   * Create a JWT token for a user
   */
  async createUserToken({
    user,
    duration,
  }: {
    user: User
    /**
     * The duration of the token
     * If not provided the token will be valid indefinitely
     */
    duration?: Duration
  }) {
    const options: JwtSignOptions = {}

    if (duration) {
      options.expiresIn = duration.inSeconds
    }

    const payload: JWTPayload = {
      type: 'token',
      userId: user.id,
      role: user.role,
    }

    return this.jwtService.sign(payload, options)
  }

  /**
   * Authenticate a user with email and password
   * Returns a JWT token if the credentials are valid
   */
  async loginWithPassword({
    email,
    password,
  }: {
    email: string
    password: string
  }) {
    const user = await this.usersService.getByEmail({
      email,
    })

    if (!user) {
      throw new AppError({
        message: 'Invalid credentials',
        code: 'security.invalid_credentials',
        status: 401,
      })
    }

    const credentials = await this.usersService.getCredential({
      type: 'token',
      userId: user.id,
    })

    if (!credentials) {
      throw new AppError({
        message: 'Invalid credentials',
        code: 'security.invalid_credentials',
        status: 401,
      })
    }

    const isPasswordValid = await bcrypt.compare(password, credentials.password)

    if (!isPasswordValid) {
      throw new AppError({
        message: 'Invalid credentials',
        code: 'security.invalid_credentials',
        status: 401,
      })
    }

    const token = await this.createUserToken({
      user,
    })

    return {
      token,
    }
  }

  /**
   * Verify tokens validity
   * checks that the payload has all the required fields
   * if the tokens is an api-key verify that there is an api-key with the same jwt in the database
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    const payload = (await this.jwtService.verifyAsync(
      token
    )) as Partial<JWTPayload>

    if (!payload.userId || !payload.type || !payload.role) {
      const missingFields = [
        !payload.userId && 'userId',
        !payload.type && 'type',
        !payload.role && 'role',
      ]
        .filter((field) => field)
        .join(',')

      throw new AppError({
        code: 'security.invalid_token',
        status: 401,
        message: `Invalid token, missing fields [${missingFields}]`,
        context: { payload },
      })
    }

    if (payload.type !== 'token') {
      throw new AppError({
        code: 'security.invalid_token',
        status: 401,
        message: 'Invalid token, no API Key found',
        context: { payload },
      })
    }

    return {
      type: 'token',
      userId: payload.userId,
      role: payload.role,
    } as JWTPayload
  }

  /**
   * Get the cookie name and domain from the origin
   * @param origin The origin of the request
   * @returns The cookie name and domain
   */
  getCookieSpec(origin: string): { name: string; domain: string } {
    const url = new URL(origin)

    // Clean the hostname for cookie name (remove port and special characters)
    const cleanHost = url.hostname.replace(/[^a-zA-Z0-9.-]/g, '-')

    return {
      name: `evently-jwt-${cleanHost}`,
      domain: url.hostname, // Use hostname instead of host to avoid port issues
    }
  }
}
