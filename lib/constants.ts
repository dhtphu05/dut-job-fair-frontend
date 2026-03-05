/**
 * API Configuration and Constants
 * Central place for all API endpoints and configuration
 */

// API Base URL - will be updated to point to your backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
}

// Scanner endpoints
export const SCANNER_ENDPOINTS = {
  SCAN: '/scanner/scan',
  SCAN_QR: '/scanner/scan-qr',
  GET_VISITOR: '/scanner/visitor/:visitorId',
  GET_SCANS: '/scanner/scans',
  RECENT_SCANS: '/scanner/recent-scans',
  GET_CHECKINS: '/scanner/checkins',
}

// School Admin endpoints
export const SCHOOL_ADMIN_ENDPOINTS = {
  DASHBOARD: '/school-admin/dashboard',
  STATS: '/school-admin/stats',
  BOOTHS: '/school-admin/booths',
  PRIZES: '/school-admin/prizes',
  UPDATE_PRIZE: '/school-admin/prizes/:prizeId',
  EXPORT_DATA: '/school-admin/export',
  VISITORS: '/school-admin/visitors',
}

// Business Admin endpoints
export const BUSINESS_ADMIN_ENDPOINTS = {
  DASHBOARD: '/business-admin/dashboard',
  BOOTH_STATS: '/business-admin/booth/:boothId',
  VISITORS: '/business-admin/visitors',
  EXPORT_VISITORS: '/business-admin/export-visitors',
  BOOTH_SETTINGS: '/business-admin/booth/:boothId/settings',
}

// User roles
export const USER_ROLES = {
  VISITOR: 'visitor',
  SCHOOL_ADMIN: 'school_admin',
  BUSINESS_ADMIN: 'business_admin',
  SUPERADMIN: 'superadmin',
} as const

// Scan status
export const SCAN_STATUS = {
  SUCCESS: 'success',
  DUPLICATE: 'duplicate',
  ERROR: 'error',
  PENDING: 'pending',
} as const

// Prize types
export const PRIZE_TYPES = {
  EARLY_BIRD: 'early_bird',
  LUCKY_DRAW: 'lucky_draw',
  BOOTH_SPECIAL: 'booth_special',
} as const
