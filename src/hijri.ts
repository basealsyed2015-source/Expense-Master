/**
 * Official Saudi Hijri calendar is Umm al-Qura (`islamic-umalqura`).
 * ICU `islamic` is an astronomical approximation and is often 1 day off.
 */
export const HIJRI_CALENDAR = 'islamic-umalqura'
export const HIJRI_DISPLAY_LOCALE = 'ar-SA-u-ca-islamic-umalqura'
export const HIJRI_PARTS_LOCALE = 'en-u-ca-islamic-umalqura'
export const RIYADH_TIME_ZONE = 'Asia/Riyadh'

export function formatHijriDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string {
  return date.toLocaleDateString(HIJRI_DISPLAY_LOCALE, {
    timeZone: RIYADH_TIME_ZONE,
    ...options,
  })
}

export function getHijriDateParts(
  date: Date,
  timeZone: string = RIYADH_TIME_ZONE
): { year: number; month: number; day: number } | null {
  const parts = new Intl.DateTimeFormat(HIJRI_PARTS_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  }).formatToParts(date)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return { year, month, day }
}
