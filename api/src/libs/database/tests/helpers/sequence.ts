const sequences = new Map<string, number>()

/**
 * Use this function to generate an unique string.
 *
 * This is used mainly in factories to generate fake but predictable data.
 */
export function sequence(word: string, separator?: string) {
  const current = sequences.get(word) ?? 0
  sequences.set(word, current + 1)
  return `${word}${separator ?? ' '}${current}`
}

type OmitProperties<T, U> = Omit<T, keyof U>

/**
 * Utility type to declare the type of the parameters of a factory function.
 *
 * @param TEntity The type of the object to be created
 * @param TMandatoryKeys The keys of the object that are required
 *
 * @example To make only the `tenantId` required:
 * ```
 * type FactoryKnowledgeEntryParams = FactoryParams<
 *  KnowledgeEntryCreate,
 * 'tenantId'
 * ```
 * >
 */
export type FactoryParams<
  TEntity,
  TMandatoryKeys extends keyof TEntity = keyof TEntity,
> = Pick<TEntity, TMandatoryKeys> &
  Partial<OmitProperties<TEntity, Pick<TEntity, TMandatoryKeys>>>
