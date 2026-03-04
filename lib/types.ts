/**
 * Type definitions for DUT Job Fair application
 */

export type UserRole = 'visitor' | 'school_admin' | 'business_admin' | 'superadmin'

export type ScanStatus = 'success' | 'duplicate' | 'error' | 'pending'

export type PrizeType = 'early_bird' | 'lucky_draw' | 'booth_special'

// User types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface AuthUser extends User {
  token: string
  refreshToken?: string
}

// Visitor types
export interface Visitor {
  id: string
  studentCode: string
  fullName: string
  email: string
  phone: string
  major: string
  year: number
  createdAt: string
  updatedAt: string
}

// Booth types
export interface Booth {
  id: string
  name: string
  company: string
  position: string
  visitorCount: number
  staffName: string
  createdAt: string
  updatedAt: string
}

// Scan types
export interface ScanRecord {
  id: string
  visitorId: string
  boothId: string
  timestamp: string
  status: ScanStatus
  visitor?: Visitor
  booth?: Booth
}

export interface ScanRequest {
  visitorCode: string
  boothId: string
}

export interface ScanResponse {
  success: boolean
  status: ScanStatus
  message: string
  visitor?: Visitor
  scanId?: string
}

// Prize types
export interface Prize {
  id: string
  name: string
  type: PrizeType
  description: string
  quantity: number
  qualificationRule: string
  winners?: string[]
  createdAt: string
  updatedAt: string
}

// Dashboard types
export interface DashboardStats {
  totalVisitors: number
  totalBooths: number
  totalScans: number
  averageScansPerBooth: number
  peakHours: Array<{ hour: number; count: number }>
}

export interface BoothStats {
  boothId: string
  boothName: string
  visitorCount: number
  scanCount: number
  uniqueVisitors: number
  topHours: Array<{ hour: number; count: number }>
}

export interface SchoolAdminDashboard {
  stats: DashboardStats
  booths: Booth[]
  prizes: Prize[]
  recentScans: ScanRecord[]
}

export interface BusinessAdminDashboard {
  boothStats: BoothStats
  recentVisitors: Visitor[]
  trends: Array<{ time: string; count: number }>
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Filter params
export interface FilterParams extends PaginationParams {
  search?: string
  dateFrom?: string
  dateTo?: string
  boothId?: string
  status?: string
}

// Export data
export interface ExportOptions {
  format: 'csv' | 'xlsx'
  includeFields: string[]
  filters?: FilterParams
}

export interface ExportResponse {
  url: string
  fileName: string
  createdAt: string
}
