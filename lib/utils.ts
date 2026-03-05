import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const VN_OFFSET_MS = 7 * 60 * 60 * 1000 // UTC+7

/** Normalise any ISO timestamp string to a UTC Date object */
function toUTCDate(timestamp: string): Date {
  const utc = timestamp.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(timestamp)
    ? timestamp
    : timestamp + 'Z'
  return new Date(utc)
}

/** Format an ISO timestamp string as HH:mm in Vietnam timezone (UTC+7) */
export function formatVNTime(timestamp: string): string {
  const vnDate = new Date(toUTCDate(timestamp).getTime() + VN_OFFSET_MS)
  const h = vnDate.getUTCHours().toString().padStart(2, '0')
  const m = vnDate.getUTCMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

/** Format an ISO timestamp string as DD/MM/YYYY HH:mm in Vietnam timezone (UTC+7) */
export function formatVNDateTime(timestamp: string): string {
  const vnDate = new Date(toUTCDate(timestamp).getTime() + VN_OFFSET_MS)
  const day = vnDate.getUTCDate().toString().padStart(2, '0')
  const month = (vnDate.getUTCMonth() + 1).toString().padStart(2, '0')
  const year = vnDate.getUTCFullYear()
  const h = vnDate.getUTCHours().toString().padStart(2, '0')
  const m = vnDate.getUTCMinutes().toString().padStart(2, '0')
  return `${day}/${month}/${year} ${h}:${m}`
}
