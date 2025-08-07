import assert from 'node:assert'

export function getEnv(key: string, defaultValue?: string) {
  const value = process.env[key]

  if (!value) {
    assert(defaultValue, `Environment variable ${key} is not set`)

    return defaultValue
  }

  return value
}
