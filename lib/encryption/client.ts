// Client-side encryption for JuriPlateforme
// Zero-knowledge architecture: server never sees plaintext

import * as crypto from 'crypto'

export interface EncryptionKey {
  key: CryptoKey
  salt: Uint8Array
  iv: Uint8Array
}

export interface EncryptedData {
  ciphertext: string
  iv: string
  salt: string
  version: string
}

class EncryptionClient {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly SALT_LENGTH = 16
  private static readonly IV_LENGTH = 12
  private static readonly VERSION = '1.0'
  
  /**
   * Derive encryption key from password
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    )
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  /**
   * Generate new encryption key from password
   */
  static async generateKey(password: string): Promise<EncryptionKey> {
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))
    const key = await this.deriveKey(password, salt)
    
    return { key, salt, iv }
  }
  
  /**
   * Restore encryption key from stored data
   */
  static async restoreKey(password: string, salt: string, iv: string): Promise<EncryptionKey> {
    const saltBytes = this.base64ToBytes(salt)
    const ivBytes = this.base64ToBytes(iv)
    const key = await this.deriveKey(password, saltBytes)
    
    return { key, salt: saltBytes, iv: ivBytes }
  }
  
  /**
   * Encrypt data
   */
  static async encrypt(
    data: string,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<EncryptedData> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      dataBuffer
    )
    
    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.bytesToBase64(iv),
      salt: '', // Salt is not needed for individual encryption
      version: this.VERSION
    }
  }
  
  /**
   * Decrypt data
   */
  static async decrypt(
    encryptedData: EncryptedData,
    key: CryptoKey
  ): Promise<string> {
    const iv = this.base64ToBytes(encryptedData.iv)
    const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext)
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      ciphertext
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }
  
  /**
   * Encrypt file
   */
  static async encryptFile(
    file: File,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<{ encrypted: ArrayBuffer; iv: string }> {
    const fileBuffer = await file.arrayBuffer()
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      fileBuffer
    )
    
    return {
      encrypted,
      iv: this.bytesToBase64(iv)
    }
  }
  
  /**
   * Decrypt file
   */
  static async decryptFile(
    encrypted: ArrayBuffer,
    key: CryptoKey,
    iv: string
  ): Promise<ArrayBuffer> {
    const ivBytes = this.base64ToBytes(iv)
    
    return crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: ivBytes
      },
      key,
      encrypted
    )
  }
  
  /**
   * Generate key for document (derived from master key)
   */
  static async generateDocumentKey(masterKey: CryptoKey, documentId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const documentIdBuffer = encoder.encode(documentId)
    
    return crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: encoder.encode('juriplateforme-document'),
        info: documentIdBuffer,
        hash: 'SHA-256'
      },
      masterKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  /**
   * Hash password for storage (not for encryption)
   */
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    
    const hash = await crypto.subtle.digest('SHA-256', passwordBuffer)
    return this.arrayBufferToBase64(hash)
  }
  
  /**
   * Generate secure random string
   */
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const randomValues = crypto.getRandomValues(new Uint8Array(length))
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length]
    }
    
    return result
  }
  
  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const newHash = await this.hashPassword(password)
    return newHash === hash
  }
  
  // Utility methods
  
  private static bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
  }
  
  private static base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    
    return bytes
  }
  
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    return this.bytesToBase64(bytes)
  }
  
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const bytes = this.base64ToBytes(base64)
    return bytes.buffer as ArrayBuffer
  }
  
  /**
   * Create encryption key from user password
   * This should be called during registration/login
   */
  static async createUserEncryption(password: string): Promise<{
    keyData: EncryptionKey
    keyHash: string
  }> {
    const keyData = await this.generateKey(password)
    const keyHash = await this.hashPassword(password)
    
    return { keyData, keyHash }
  }
  
  /**
   * Encrypt sensitive user data
   */
  static async encryptUserData(
    data: Record<string, any>,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<EncryptedData> {
    const jsonString = JSON.stringify(data)
    return this.encrypt(jsonString, key, iv)
  }
  
  /**
   * Decrypt sensitive user data
   */
  static async decryptUserData(
    encryptedData: EncryptedData,
    key: CryptoKey
  ): Promise<Record<string, any>> {
    const jsonString = await this.decrypt(encryptedData, key)
    return JSON.parse(jsonString)
  }
  
  /**
   * Encrypt chat message
   */
  static async encryptMessage(
    message: string,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<{ ciphertext: string; iv: string }> {
    const encrypted = await this.encrypt(message, key, iv)
    return {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv
    }
  }
  
  /**
   * Decrypt chat message
   */
  static async decryptMessage(
    ciphertext: string,
    iv: string,
    key: CryptoKey
  ): Promise<string> {
    const encryptedData: EncryptedData = {
      ciphertext,
      iv,
      salt: '',
      version: this.VERSION
    }
    
    return this.decrypt(encryptedData, key)
  }
  
  /**
   * Generate key pair for PGP-like encryption (future feature)
   */
  static async generateKeyPair(): Promise<{
    publicKey: CryptoKey
    privateKey: CryptoKey
  }> {
    return crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )
  }
  
  /**
   * Export key to string for storage
   */
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('jwk', key)
    return JSON.stringify(exported)
  }
  
  /**
   * Import key from string
   */
  static async importKey(jwkString: string, usages: KeyUsage[]): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkString)
    return crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      usages
    )
  }
  
  /**
   * Create document encryption metadata
   */
  static createDocumentEncryptionMetadata(): {
    documentIv: string
    encryptionKey: string
  } {
    const documentIv = this.generateRandomString(this.IV_LENGTH)
    const encryptionKey = this.generateRandomString(32)
    
    return { documentIv, encryptionKey }
  }
  
  /**
   * Validate encryption parameters
   */
  static validateEncryptionParameters(params: any): boolean {
    try {
      if (!params.ciphertext || !params.iv || !params.version) {
        return false
      }
      
      // Validate base64 format
      this.base64ToBytes(params.ciphertext)
      this.base64ToBytes(params.iv)
      
      return params.version === this.VERSION
    } catch {
      return false
    }
  }
  
  /**
   * Get encryption info for debugging
   */
  static getEncryptionInfo(): {
    algorithm: string
    keyLength: number
    version: string
    supported: boolean
  } {
    return {
      algorithm: this.ALGORITHM,
      keyLength: this.KEY_LENGTH,
      version: this.VERSION,
      supported: typeof crypto !== 'undefined' && crypto.subtle !== undefined
    }
  }
}

export default EncryptionClient