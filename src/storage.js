// Storage wrapper. Uses window.storage when available (Claude artifact runtime).
// Falls back to localStorage in regular browsers so the app remains functional
// when deployed standalone.

const hasWindowStorage =
  typeof window !== 'undefined' &&
  window.storage &&
  typeof window.storage.getItem === 'function'

function rawGet(key) {
  if (hasWindowStorage) return window.storage.getItem(key)
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function rawSet(key, value) {
  if (hasWindowStorage) return window.storage.setItem(key, value, { shared: false })
  try {
    localStorage.setItem(key, value)
  } catch {
    /* quota exceeded, ignore */
  }
}

function rawRemove(key) {
  if (hasWindowStorage) return window.storage.removeItem(key)
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function rawKeys() {
  if (hasWindowStorage && typeof window.storage.keys === 'function') {
    return window.storage.keys() || []
  }
  try {
    return Object.keys(localStorage)
  } catch {
    return []
  }
}

export function getJSON(key, fallback = null) {
  const raw = rawGet(key)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function setJSON(key, value) {
  rawSet(key, JSON.stringify(value))
}

export function remove(key) {
  rawRemove(key)
}

export function keysWithPrefix(prefix) {
  return rawKeys().filter((k) => typeof k === 'string' && k.startsWith(prefix))
}

export function getAllCheckins() {
  const prefix = 'checkin:'
  const keys = keysWithPrefix(prefix)
  const out = []
  for (const k of keys) {
    const v = getJSON(k)
    if (v && typeof v === 'object') out.push({ date: k.slice(prefix.length), ...v })
  }
  out.sort((a, b) => (a.date < b.date ? -1 : 1))
  return out
}

export function clearAll() {
  const keys = rawKeys()
  for (const k of keys) {
    if (
      k === 'patroon:beschrijving' ||
      k === 'patroon:startdatum' ||
      (typeof k === 'string' && k.startsWith('checkin:'))
    ) {
      rawRemove(k)
    }
  }
}
