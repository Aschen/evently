import createDebugLogger from 'debug'

export function createDebug(name: string) {
  if (Boolean(process.env.DEBUG)) {
    return createDebugLogger(`evently:${name}`)
  }

  return undefined
}
