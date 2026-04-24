import type { UnitType } from '@/lib/types'

type UnitMeta = {
  key: UnitType
  title: string
  plural: string
  shortTitle: string
  badgeClass: string
  accentClass: string
  chipClass: string
  analyticsColor: string
  compareColor: string
}

export const UNIT_META: Record<UnitType, UnitMeta> = {
  booth: {
    key: 'booth',
    title: 'Booth doanh nghiệp',
    plural: 'Booth doanh nghiệp',
    shortTitle: 'Booth',
    badgeClass: 'bg-blue-100 text-blue-700 border-transparent',
    accentClass: 'bg-blue-50 text-blue-700',
    chipClass: 'bg-blue-600 text-white shadow-lg shadow-blue-200',
    analyticsColor: '#2563EB',
    compareColor: '#2563EB',
  },
  workshop: {
    key: 'workshop',
    title: 'Hội thảo',
    plural: 'Hội thảo',
    shortTitle: 'Hội thảo',
    badgeClass: 'bg-orange-100 text-orange-700 border-transparent',
    accentClass: 'bg-orange-50 text-orange-700',
    chipClass: 'bg-orange-500 text-white shadow-lg shadow-orange-200',
    analyticsColor: '#F97316',
    compareColor: '#F97316',
  },
  totnghiep: {
    key: 'totnghiep',
    title: 'Tốt nghiệp',
    plural: 'Khu tốt nghiệp',
    shortTitle: 'Tốt nghiệp',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-transparent',
    accentClass: 'bg-emerald-50 text-emerald-700',
    chipClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200',
    analyticsColor: '#059669',
    compareColor: '#059669',
  },
}

export const UNIT_TYPE_OPTIONS: UnitType[] = ['booth', 'workshop', 'totnghiep']

export function getUnitMeta(type: UnitType) {
  return UNIT_META[type]
}

export function getUnitTypeLabel(type: UnitType) {
  return UNIT_META[type].title
}
