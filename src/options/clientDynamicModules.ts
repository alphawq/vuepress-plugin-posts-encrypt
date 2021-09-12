import { Options, Context } from '../index'

export default (options: Options, ctx: Context) => () => ({
  name: 'decrypt.js',
  content: `
    import cryptoJS from 'crypto-js'
    export function decrypt (passphrase, encryptedMsg) {
      if(!encryptedMsg) return false
      const encryptedHMAC = encryptedMsg.substring(0, 64)
      const encryptedCtn = encryptedMsg.substring(64)
      const decryptedHMAC = cryptoJS.HmacSHA256(
        encryptedCtn,
        cryptoJS.SHA256(passphrase).toString()
      ).toString()
      return decryptedHMAC === encryptedHMAC
    }
    `
})



