import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { EnsureAuthGuard } from '../guards/EnsureAuthGuard'
import { PUBLIC_API_KEY } from '../decorators/PublicApi'
import { API_ACTION_KEY } from 'src/features/auth/decorators/Auth'

describe('EnsureAuthGuard', () => {
  let guard: EnsureAuthGuard
  let reflector: jest.Mocked<Reflector>
  let context: ExecutionContext

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any
    guard = new EnsureAuthGuard(reflector)

    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any
  })

  it('should allow a public route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PUBLIC_API_KEY) return true
      return null
    })

    expect(guard.canActivate(context)).toBe(true)
  })

  it('should allow a route with valid scopes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PUBLIC_API_KEY) return false
      if (key === API_ACTION_KEY) return 'test:action'
      return null
    })

    expect(guard.canActivate(context)).toBe(true)
  })

  it('should reject a route without scopes or public decorator in development mode', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PUBLIC_API_KEY) return false
      if (key === API_ACTION_KEY) return null
      return null
    })

    expect(() => guard.canActivate(context)).toThrow(
      'This route has no authentication decorator (@Auth or @PublicApi) defined, and cannot be accessed'
    )
  })

  it('should throw an error when @PublicApi and @Auth are used together', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PUBLIC_API_KEY) return true
      if (key === API_ACTION_KEY) return 'test:action'
      return null
    })

    expect(() => guard.canActivate(context)).toThrow(
      'Cannot use both @PublicApi and @Auth decorators on the same route'
    )
  })
})
