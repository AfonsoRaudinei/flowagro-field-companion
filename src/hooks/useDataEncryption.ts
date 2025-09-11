/**
 * Data Encryption Hook - Fase 3 Hardening  
 * Implementa criptografia client-side para dados sensíveis
 */

import { useState, useCallback, useEffect } from 'react';

interface EncryptionConfig {
  algorithm: 'AES-GCM';
  keyLength: 256;
  ivLength: 12;
  tagLength: 16;
}

interface EncryptedData {
  data: string;
  iv: string;
  timestamp: number;
  version: string;
}

export function useDataEncryption() {
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const config: EncryptionConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12,
    tagLength: 16
  };

  // Check Web Crypto API support
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        typeof window !== 'undefined' && 
        'crypto' in window && 
        'subtle' in window.crypto &&
        typeof window.crypto.subtle.generateKey === 'function';
      
      setIsSupported(supported);
      
      if (!supported) {
        console.warn('[Encryption] Web Crypto API not supported');
      }
    };

    checkSupport();
  }, []);

  // Generate or retrieve encryption key
  const initializeKey = useCallback(async (): Promise<CryptoKey | null> => {
    if (!isSupported) return null;

    try {
      // Try to get existing key from IndexedDB
      const existingKey = await getStoredKey();
      if (existingKey) {
        setCryptoKey(existingKey);
        return existingKey;
      }

      // Generate new key
      const key = await window.crypto.subtle.generateKey(
        {
          name: config.algorithm,
          length: config.keyLength
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      // Store key securely
      await storeKey(key);
      setCryptoKey(key);
      
      console.log('[Encryption] New encryption key generated');
      return key;
    } catch (error) {
      console.error('[Encryption] Key initialization failed:', error);
      return null;
    }
  }, [isSupported]);

  // Store key in IndexedDB
  const storeKey = async (key: CryptoKey): Promise<void> => {
    if (!('indexedDB' in window)) {
      console.warn('[Encryption] IndexedDB not available');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FlowAgroSecure', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys');
        }
      };
      
      request.onsuccess = async () => {
        const db = request.result;
        
        try {
          const exportedKey = await window.crypto.subtle.exportKey('raw', key);
          const transaction = db.transaction(['keys'], 'readwrite');
          const store = transaction.objectStore('keys');
          
          store.put(exportedKey, 'main-encryption-key');
          
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          
          transaction.onerror = () => reject(transaction.error);
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  };

  // Retrieve key from IndexedDB
  const getStoredKey = async (): Promise<CryptoKey | null> => {
    if (!('indexedDB' in window)) return null;

    return new Promise((resolve) => {
      const request = indexedDB.open('FlowAgroSecure', 1);
      
      request.onerror = () => resolve(null);
      
      request.onsuccess = async () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('keys')) {
          db.close();
          resolve(null);
          return;
        }

        try {
          const transaction = db.transaction(['keys'], 'readonly');
          const store = transaction.objectStore('keys');
          const keyRequest = store.get('main-encryption-key');
          
          keyRequest.onsuccess = async () => {
            db.close();
            
            if (!keyRequest.result) {
              resolve(null);
              return;
            }

            try {
              const key = await window.crypto.subtle.importKey(
                'raw',
                keyRequest.result,
                { name: config.algorithm },
                true,
                ['encrypt', 'decrypt']
              );
              
              resolve(key);
            } catch (error) {
              console.error('[Encryption] Key import failed:', error);
              resolve(null);
            }
          };
          
          keyRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch (error) {
          db.close();
          resolve(null);
        }
      };
    });
  };

  // Encrypt data
  const encrypt = useCallback(async (plaintext: string): Promise<EncryptedData | null> => {
    if (!isSupported || !cryptoKey) {
      console.warn('[Encryption] Encryption not available');
      return null;
    }

    try {
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(config.ivLength));
      
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      
      // Encrypt
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: config.algorithm,
          iv: iv,
          tagLength: config.tagLength * 8 // Convert bytes to bits
        },
        cryptoKey,
        data
      );
      
      // Convert to base64 for storage
      const encryptedArray = new Uint8Array(encrypted);
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      
      return {
        data: encryptedBase64,
        iv: ivBase64,
        timestamp: Date.now(),
        version: '1.0'
      };
    } catch (error) {
      console.error('[Encryption] Encryption failed:', error);
      return null;
    }
  }, [isSupported, cryptoKey]);

  // Decrypt data
  const decrypt = useCallback(async (encryptedData: EncryptedData): Promise<string | null> => {
    if (!isSupported || !cryptoKey) {
      console.warn('[Encryption] Decryption not available');
      return null;
    }

    try {
      // Convert from base64
      const encryptedBytes = new Uint8Array(
        atob(encryptedData.data).split('').map(char => char.charCodeAt(0))
      );
      const iv = new Uint8Array(
        atob(encryptedData.iv).split('').map(char => char.charCodeAt(0))
      );
      
      // Decrypt
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: config.algorithm,
          iv: iv,
          tagLength: config.tagLength * 8
        },
        cryptoKey,
        encryptedBytes
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('[Encryption] Decryption failed:', error);
      return null;
    }
  }, [isSupported, cryptoKey]);

  // Encrypt and store in localStorage
  const encryptAndStore = useCallback(async (key: string, value: string): Promise<boolean> => {
    const encrypted = await encrypt(value);
    
    if (!encrypted) return false;
    
    try {
      localStorage.setItem(`enc_${key}`, JSON.stringify(encrypted));
      return true;
    } catch (error) {
      console.error('[Encryption] Storage failed:', error);
      return false;
    }
  }, [encrypt]);

  // Retrieve and decrypt from localStorage
  const retrieveAndDecrypt = useCallback(async (key: string): Promise<string | null> => {
    try {
      const stored = localStorage.getItem(`enc_${key}`);
      
      if (!stored) return null;
      
      const encryptedData: EncryptedData = JSON.parse(stored);
      return await decrypt(encryptedData);
    } catch (error) {
      console.error('[Encryption] Retrieval failed:', error);
      return null;
    }
  }, [decrypt]);

  // Generate hash for data integrity
  const generateHash = useCallback(async (data: string): Promise<string | null> => {
    if (!isSupported) return null;

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      
      return btoa(String.fromCharCode(...hashArray));
    } catch (error) {
      console.error('[Encryption] Hash generation failed:', error);
      return null;
    }
  }, [isSupported]);

  // Verify data integrity
  const verifyIntegrity = useCallback(async (data: string, expectedHash: string): Promise<boolean> => {
    const actualHash = await generateHash(data);
    return actualHash === expectedHash;
  }, [generateHash]);

  // Initialize key on mount
  useEffect(() => {
    if (isSupported && !cryptoKey) {
      initializeKey();
    }
  }, [isSupported, cryptoKey, initializeKey]);

  return {
    isSupported,
    isReady: !!cryptoKey,
    encrypt,
    decrypt,
    encryptAndStore,
    retrieveAndDecrypt,
    generateHash,
    verifyIntegrity,
    initializeKey
  };
}