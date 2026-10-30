/** ISO values without an offset follow the API's UTC convention.
 * Legacy attendance strings (YYYY-MM-DD HH:mm:ss) are displayed as Vietnam time.
 */
export function checkinTimestamp(value: string | null | undefined): number {
  if (!value?.trim()) return NaN
  const timestamp = value.trim()
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(timestamp)) return Date.parse(timestamp.replace(' ', 'T'))
  return Date.parse(timestamp.includes(' ') ? timestamp.replace(' ', 'T') + '+07:00' : timestamp + 'Z')
}

export function isCheckinVisible(value: string | null | undefined, now: number): boolean {
  return checkinTimestamp(value) <= now
}
