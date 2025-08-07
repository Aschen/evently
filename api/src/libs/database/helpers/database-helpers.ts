import { AppError } from 'src/libs/errors/AppError'

/**
 * Use this method with a repository method to returns null if the entity is not found.
 *
 * @example
 * ```
 * const user = await foundOrNull(userService.getById({ id }))
 * // user can be null if the user is not found
 * ```
 */
export function foundOrNull<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((e) => {
    if (e instanceof AppError && e.code === 'repository.not_found') {
      return null
    }

    throw e
  })
}

/**
 * Use this method with a repository method to throw an error if the entity is not found.
 *
 * @example
 * ```
 * const user = await foundOrThrow(UsersRepository.findBy({ id }))
 * // user cannot be null
 * ```
 */
export async function foundOrThrow<T extends NonNullable<unknown>>(
  promise: Promise<T | null>
): Promise<T> {
  const value = await promise

  if (value === null) {
    throw new AppError({
      code: 'repository.not_found',
      status: 404,
      message: 'Entity not found',
    })
  }

  return value
}
