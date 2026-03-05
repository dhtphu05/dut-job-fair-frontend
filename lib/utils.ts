import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const VN_TZ = 'Asia/Ho_Chi_Minh'

/** Format an ISO timestamp string as HH:mm in Vietnam timezone */
export function formatVNTime(timestamp: string): string {
  const utc = timestamp.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(timestamp)
    ? timestamp
    : timestamp + 'Z'
  return new Date(utc).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: VN_TZ,
  })
}

/** Format an ISO timestamp string as DD/MM/YYYY HH:mm in Vietnam timezone */
export function formatVNDateTime(timestamp: string): string {
  const utc = timestamp.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(timestamp)
    ? timestamp
    : timestamp + 'Z'
  return new Date(utc).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: VN_TZ,
  })
}
