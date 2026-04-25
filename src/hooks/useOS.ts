import { useSyncExternalStore } from 'react'

type OS = 'mac' | 'windows' | 'linux' | 'unknown'

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'unknown'
  const platform = navigator.platform?.toLowerCase() ?? ''
  if (/mac|ipod|iphone|ipad/.test(platform)) return 'mac'
  if (platform.includes('win')) return 'windows'
  if (platform.includes('linux')) return 'linux'
  return 'unknown'
}

const os = detectOS()
const isMac = os === 'mac'

const snapshot = { os, isMac, modKey: isMac ? '⌘' : 'Ctrl' as const }
const serverSnapshot = { os: 'unknown' as OS, isMac: false, modKey: 'Ctrl' as const }

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return serverSnapshot
}

export function useOS() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
