const PREFIX = 'ssb_'

function key(name) {
  return PREFIX + name
}

export function storageGet(name, fallback = null) {
  try {
    const raw = localStorage.getItem(key(name))
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function storageSet(name, value) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function storageRemove(name) {
  try {
    localStorage.removeItem(key(name))
  } catch {
    // silent
  }
}

export function storageClear() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
  } catch {
    // silent
  }
}
