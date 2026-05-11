/**
 * Saudi Arabian cities (Arabic). Curated from official / statistics city lists
 * (population-ranked cities and major provincial towns).
 */

const RAW: string[] = [
  'أبها',
  'أبو عريش',
  'أحد المسارحة',
  'أحد رفيدة',
  'أضم',
  'أملج',
  'الأسياح',
  'الأفلاج',
  'الأحساء',
  'الاحساء',
  'الباحة',
  'البكيرية',
  'البدائع',
  'البدع',
  'الجبيل',
  'الجموم',
  'الحائط',
  'الحناكية',
  'الخرج',
  'الخرمة',
  'الدائر',
  'الدرب',
  'الدرعية',
  'الدمام',
  'الدوادمي',
  'الرس',
  'الزلفي',
  'السليل',
  'الطائف',
  'الطوال',
  'الظهران',
  'العلا',
  'الغاط',
  'القريات',
  'القطيف',
  'القنفذة',
  'القويعية',
  'الليث',
  'المجاردة',
  'المجمعة',
  'المدينة المنورة',
  'المذنب',
  'المزاحمية',
  'المهد',
  'المويه',
  'المخواة',
  'النبهانية',
  'النعيرية',
  'النماص',
  'الوجه',
  'بارق',
  'بالقرن',
  'بدر',
  'بريدة',
  'بقعاء',
  'بلجرشي',
  'بقيق',
  'بيش',
  'بيشة',
  'تبوك',
  'تثليث',
  'تربة',
  'تيماء',
  'جازان',
  'جدة',
  'حائل',
  'حريملاء',
  'حفر الباطن',
  'حوطة بني تميم',
  'خميس مشيط',
  'خليص',
  'خيبر',
  'دومة الجندل',
  'رابغ',
  'رجال المع',
  'رأس تنورة',
  'رفحاء',
  'رنية',
  'رنيه',
  'سكاكا',
  'سراة عبيدة',
  'شرورة',
  'شقراء',
  'صامطة',
  'صبيا',
  'ضباء',
  'ضمد',
  'طبرجل',
  'طريف',
  'ظهران الجنوب',
  'عرعر',
  'عفيف',
  'عنيزة',
  'قرية العليا',
  'قلوه',
  'مكة المكرمة',
  'محايل',
  'مدينة الملك عبدالله الاقتصادية',
  'ميسان',
  'نجران',
  'وادي الدواسر',
  'ينبع',
  'بحرة',
  'الخبر',
  'الخفجي',
  'العارضة',
  'العرضيات',
  'الكامل',
  'الرياض',
  'فرسان',
  'ينبع النخل'
]

function uniqSortedAr(names: string[]): string[] {
  return [...new Set(names.map((n) => String(n).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ar')
  )
}

/** Distinct cities (Arabic) for tenant address dropdowns */
export const SAUDI_ARABIA_CITIES_AR: readonly string[] = uniqSortedAr(RAW)

const CITY_SET = new Set(SAUDI_ARABIA_CITIES_AR)

export function isValidSaudiCityName(city: string | null | undefined): boolean {
  if (city == null || String(city).trim() === '') return true
  return CITY_SET.has(String(city).trim())
}

function escOpt(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * `<option>` elements for a city `<select>` (no wrapping `<select>`).
 * If stored value is missing from the list, adds one legacy `<option selected>`.
 */
export function buildSaudiCitySelectOptionsHtml(selectedCity?: string | null): string {
  const sel = (selectedCity ?? '').trim()
  const parts: string[] = ['<option value="">— اختر المدينة —</option>']
  if (sel && !CITY_SET.has(sel)) {
    parts.push(`<option value="${escOpt(sel)}" selected>${escOpt(sel)}</option>`)
  }
  for (const c of SAUDI_ARABIA_CITIES_AR) {
    parts.push(`<option value="${escOpt(c)}"${sel === c ? ' selected' : ''}>${escOpt(c)}</option>`)
  }
  return parts.join('')
}
