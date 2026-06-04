import { useState, useCallback } from 'react'
import { storageGet, storageSet } from '../utils/storage'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    const existing = storageGet(key)
    if (existing !== null) return existing
    storageSet(key, initialValue)
    return initialValue
  })

  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      storageSet(key, next)
      return next
    })
  }, [key])

  return [storedValue, setValue]
}
