import fs from 'fs'
import cryptoJS from 'crypto-js'
/**
 * Salt and encrypt a msg with a password.
 */
const keySize = 256
const iterations = 1000

export const CRYPTO_INJECT = `<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js" integrity="sha512-E8QSvWZ0eCLGk4km3hxSsNmGWbLtSCSUcewDQPQWZF6pEU8GlT8a5fF32wOl1i8ftdMhssTrF/OhyGWwonTcXA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`

/**
 * 通过密码给明文进行加密
 *
 * @export
 * @param {string} content 需要加密的内容
 * @param {string} password 加密使用的密码
 * @returns
 */
export function encrypt(content: string, password: string) {
  // 必须是字符串类型
  password += ''
  const salt = cryptoJS.lib.WordArray.random(128 / 8)

  const key = cryptoJS.PBKDF2(password, salt, {
    keySize: keySize / 32,
    iterations
  })

  const iv = cryptoJS.lib.WordArray.random(128 / 8)

  const encrypted = cryptoJS.AES.encrypt(content, key, {
    iv: iv,
    padding: cryptoJS.pad.Pkcs7,
    mode: cryptoJS.mode.CBC
  })

  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  const encryptedMsg = salt.toString() + iv.toString() + encrypted.toString()
  const hmac = cryptoJS.HmacSHA256(encryptedMsg, cryptoJS.SHA256(password).toString()).toString()
  return hmac + encryptedMsg
}

/**
 * 根据 密文 + 密码 反解出明文
 *
 * @export
 * @param {string} encryptedMsg 密文
 * @param {string} password 密码
 * @returns
 */
export function decrypt(encryptedMsg: string, password: string) {
  const salt = cryptoJS.enc.Hex.parse(encryptedMsg.substr(0, 32))
  const iv = cryptoJS.enc.Hex.parse(encryptedMsg.substr(32, 32))
  const encrypted = encryptedMsg.substring(64)

  const key = cryptoJS.PBKDF2(password, salt, {
    keySize: keySize / 32,
    iterations
  })

  const decrypted = cryptoJS.AES.decrypt(encrypted, key, {
    iv: iv,
    padding: cryptoJS.pad.Pkcs7,
    mode: cryptoJS.mode.CBC
  }).toString(cryptoJS.enc.Utf8)

  return decrypted
}

/**
 * 验证密码的正确性
 *
 * @export
 * @param {string} encryptedMsg 加密后的内容
 * @param {string} password 密码
 * @returns {boolean} 密码是否正确
 */
export function validate(encryptedMsg: string, password: string): boolean {
  const encryptedHMAC = encryptedMsg.substring(0, 64)
  const encryptedHTML = encryptedMsg.substring(64)
  const decryptedHMAC = cryptoJS.HmacSHA256(encryptedHTML, cryptoJS.SHA256(password).toString()).toString()

  return decryptedHMAC === encryptedHMAC
}

export function encryptAndGenFile(encryptedPaths) {
  return (resolve, reject, next, item) => {
    const [path, pass] = item
    fs.readFile(path, { encoding: 'utf8' }, (err, content) => {
      next()
      if (err) {
        encryptedPaths.delete(path)
        reject(err)
      }
      encryptedPaths.set(path, encrypt(content, pass))
      resolve()
    })
  }
}
