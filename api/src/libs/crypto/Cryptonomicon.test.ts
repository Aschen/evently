import { Cryptonomicon } from './Cryptonomicon'

const defaultInitialSecrets = {
  aws: {
    keyId: 'key id',
    secretKey: 'very long key 1234567890 1234567890 1234567890',
    nullValue: null,
    undefinedValue: undefined,
  },
  deep: {
    nested: {
      keyId: 'key id',
      secretKey: 'very long key 1234567890 1234567890 1234567890',
      nullValue: null,
      undefinedValue: undefined,
    },
  },
}

describe('Cryptonomicon', () => {
  const vaultKey = 'the spoon does not exists'
  let decryptedSecrets = defaultInitialSecrets
  let encryptedSecrets: typeof defaultInitialSecrets
  let cryptonomicon: Cryptonomicon

  beforeEach(() => {
    decryptedSecrets = defaultInitialSecrets

    encryptedSecrets = {
      aws: {
        keyId: '9434ae851cb2.8048b7e2a8e7be693e21897ca2a83834',
        secretKey:
          'a8b8b4e42f164c47e78e234878a6e335875995ffdc8534cd18bbd8ff99b6e8bb7694bccbf7f0a8a6790e15f9b187.dfccece69716f3fd14a939e8adea53e1',
        nullValue: null,
        undefinedValue: undefined,
      },
      deep: {
        nested: {
          keyId: '9434ae851cb2.8048b7e2a8e7be693e21897ca2a83834',
          secretKey:
            'a8b8b4e42f164c47e78e234878a6e335875995ffdc8534cd18bbd8ff99b6e8bb7694bccbf7f0a8a6790e15f9b187.dfccece69716f3fd14a939e8adea53e1',
          nullValue: null,
          undefinedValue: undefined,
        },
      },
    }

    cryptonomicon = new Cryptonomicon(vaultKey)
  })

  describe('decryptString', () => {
    it('should decrypt a string', () => {
      const decrypted = cryptonomicon.decryptString(encryptedSecrets.aws.keyId)

      expect(decrypted).toBe(decryptedSecrets.aws.keyId)
    })

    it('should raise an error on invalid encrypted string format', () => {
      expect(() => {
        cryptonomicon.decryptString('invalid.')
      }).toThrow()

      expect(() => {
        cryptonomicon.decryptString('.invalid')
      }).toThrow()

      expect(() => {
        cryptonomicon.decryptString('valid.too-short-iv')
      }).toThrow()

      expect(() => {
        cryptonomicon.decryptString('')
      }).toThrow()
    })
  })

  describe('encryptString', () => {
    it('should encrypt a string in correct format', () => {
      const encrypted = cryptonomicon.encryptString(decryptedSecrets.aws.keyId)

      const [data, iv] = encrypted.split('.')

      expect(data).not.toBeFalsy()
      expect(Buffer.from(iv as string, 'hex')).toHaveLength(16)
    })

    it('should encrypt correctly', () => {
      const encrypted = cryptonomicon.encryptString(decryptedSecrets.aws.keyId)
      const decrypted = cryptonomicon.decryptString(encrypted)

      expect(decrypted).toBe(decryptedSecrets.aws.keyId)
    })
  })

  describe('decryptObject', () => {
    it('should decrypt string values of an object', () => {
      const decrypted = cryptonomicon.decryptObject(encryptedSecrets)

      expect(decrypted).toStrictEqual(decryptedSecrets)
    })
  })
})
