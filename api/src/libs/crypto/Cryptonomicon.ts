/*
 * Kuzzle, a backend software, self-hostable and ready to use
 * to power modern apps
 *
 * Copyright 2015-2020 Kuzzle
 * mailto: support AT kuzzle.io
 * website: http://kuzzle.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

import * as crypto from 'node:crypto'
import assert from 'node:assert'

/**
 * Cryptonomicon is a book serie from Neal Stephenson.
 *
 * Between technological thriller and revisited history,
 * Cryptonomicon is a must read for anyone interested in cryptography ;-)
 */
export class Cryptonomicon {
  private vaultKeyHash: Buffer

  /**
   * Prepare crypto primitives.
   * Use the key passed in parameter or in environment variable.
   *
   * @param vaultKey - key used to decrypt the secrets
   */
  constructor(vaultKey?: string) {
    const secret = vaultKey || process.env.JWT_SECRET

    if (!secret) {
      // eslint-disable-next-line -- Replace the previous assert with a throw since this was causing compilation issue when imported in Jest
      throw new Error('No vault key provided')
    }

    this.vaultKeyHash = crypto.createHash('sha256').update(secret).digest()
  }

  /**
   * Iterates recursively through object values and tries to
   * decrypt strings only.
   *
   * @param {object} encryptedSecrets - object containing the encrypted secrets
   *
   * @returns {Object} Object with decrypted values
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  decryptObject<T extends Object>(encryptedSecrets: T): T {
    let secrets

    if (Array.isArray(encryptedSecrets)) {
      secrets = []

      for (const value of encryptedSecrets) {
        if (!value) {
          secrets.push(value)
        } else if (typeof value === 'string') {
          secrets.push(this.decryptString(value))
        } else if (Object.keys(value).length === 1 && '__id' in value) {
          secrets.push(this.decryptString(value.__id))
        } else {
          secrets.push(this.decryptObject(value as T))
        }
      }
    } else {
      secrets = {} as Record<string, unknown>

      for (const [key, value] of Object.entries(encryptedSecrets)) {
        if (!value) {
          secrets[key] = value
        } else if (typeof value === 'string') {
          secrets[key] = this.decryptString(value)
        } else if (Object.keys(value).length === 1 && '__id' in value) {
          secrets[key] = this.decryptString(value.__id)
        } else {
          secrets[key] = this.decryptObject(value as T)
        }
      }
    }

    return secrets as T
  }

  /**
   * Iterates recursively through object values and encrypt string values only.
   *
   * @param {Object} secrets - Object containing secrets to be encrypted
   *
   * @returns {Object} Same object but with encrypted string values
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  encryptObject<T extends Object>(secrets: T): T {
    let encryptedSecrets

    if (Array.isArray(secrets)) {
      encryptedSecrets = []

      for (const value of secrets) {
        if (value) {
          encryptedSecrets.push(
            typeof value === 'string'
              ? this.encryptString(value)
              : this.encryptObject(value as T)
          )
        } else {
          encryptedSecrets.push(value)
        }
      }
    } else {
      encryptedSecrets = {} as Record<string, unknown>

      for (const [key, value] of Object.entries(secrets)) {
        if (value) {
          encryptedSecrets[key] =
            typeof value === 'string'
              ? this.encryptString(value)
              : this.encryptObject(value as T)
        } else {
          encryptedSecrets[key] = value
        }
      }
    }

    return encryptedSecrets as T
  }

  /**
   * Encrypts data with AES CTR using the secret key and an initialization vector
   * It's not safe to re-use an IV , so we generate a new IV each time we encrypt
   * something and we store it next to the encrypted data.
   * See https://www.wikiwand.com/en/Block_cipher_mode_of_operation#/Initialization_vector_(IV)
   *
   * @param {string} decrypted - String to encrypt
   *
   * @returns {string} Encrypted string with IV (format: <encrypted-string>.<iv>)
   */
  encryptString(decrypted: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('AES-256-CTR', this.vaultKeyHash, iv)

    const encryptedData =
      cipher.update(decrypted, 'utf8', 'hex') + cipher.final('hex')

    return `${encryptedData}.${iv.toString('hex')}`
  }

  /**
   * Decrypts a string with AES CTR using the initialization vector
   * and the sha256 hashed secret key
   *
   * @param {string} encrypted - String to decrypt (format: <encrypted-string>.<iv>)
   *
   * @returns {string} Decrypted string
   */
  decryptString(encrypted: string): string {
    const [encryptedData, ivHex] = encrypted.split('.')

    assert(encryptedData)
    assert(ivHex)

    if (encryptedData.length === 0) {
      throw new Error(
        `Invalid encrypted string format "${encryptedData}.${ivHex}"`
      )
    }

    if (ivHex.length !== 32) {
      throw new Error(`Invalid IV size. (${ivHex.length}, expected 32)`)
    }

    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(
      'AES-256-CTR',
      this.vaultKeyHash,
      iv
    )

    try {
      return (
        decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8')
      )
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('bad decrypt')) {
          throw new Error(
            'Cannot decrypt encrypted value with the provided key'
          )
        }

        throw new Error(
          `Encrypted input value format is not a valid: ${error.message}`
        )
      }

      throw error
    }
  }
}
