/**
 * Comprehensive Database Models for DUT Job Fair Platform
 * Real-world data structures for schools, students, businesses, and interactions
 */

// ============= SCHOOL & STUDENT MANAGEMENT =============

export interface School {
  id: string
  name: string
  code: string
  address: string
  phone: string
  email: string
  principalName: string
  adminContact: {
    name: string
    email: string
    phone: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface StudentProfile {
  id: string
  mssv: string // Student ID
  fullName: string
  email: string
  phone: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'other'
  schoolId: string
  major: string
  year: number // 1-4
  gpa?: number
  skills: string[]
  resume?: {
    url: string
    uploadedAt: Date
  }
  interests: string[] // Job interests/fields
  createdAt: Date
  updatedAt: Date
}

export interface StudentCheckIn {
  id: string
  studentId: string
  boothId: string
  timestamp: Date
  duration?: number // Minutes spent at booth
  notes?: string
  contactLeft: boolean // Did student leave contact info
  followUpRequired: boolean
}

export interface StudentApplication {
  id: string
  studentId: string
  businessId: string
  positionId: string
  status: 'submitted' | 'reviewed' | 'interview' | 'rejected' | 'offered'
  submittedAt: Date
  updatedAt: Date
  notes?: string
}

// ============= BUSINESS & BOOTH MANAGEMENT =============

export interface BusinessProfile {
  id: string
  name: string
  industry: string
  website: string
  description: string
  logoUrl?: string
  contact: {
    name: string
    email: string
    phone: string
    position: string
  }
  address?: string
  createdAt: Date
  updatedAt: Date
}

export interface Booth {
  id: string
  businessId: string
  boothName: string
  location: string // Floor, Zone, etc.
  capacity: number
  positions: JobPosition[]
  staffs: BoothStaff[]
  scheduleStart: Date
  scheduleEnd: Date
  specialRequirements?: string
  createdAt: Date
  updatedAt: Date
}

export interface JobPosition {
  id: string
  boothId: string
  title: string
  description: string
  requirements: string[]
  quantity: number
  level: 'entry' | 'junior' | 'mid' | 'senior'
  salary?: {
    min: number
    max: number
    currency: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface BoothStaff {
  id: string
  boothId: string
  name: string
  email: string
  phone: string
  position: string
  role: 'recruiter' | 'hr' | 'manager'
}

// ============= EVENT & SCHEDULING =============

export interface JobFairEvent {
  id: string
  name: string
  description: string
  date: Date
  startTime: Date
  endTime: Date
  location: string
  schoolId: string
  maxBooths: number
  expectedStudents: number
  status: 'planning' | 'registration' | 'ongoing' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface EventSchedule {
  id: string
  eventId: string
  boothId: string
  timeSlot: {
    start: Date
    end: Date
  }
  staffAssigned: string[]
}

// ============= COMMUNICATION & ENGAGEMENT =============

export interface StudentMessage {
  id: string
  fromStudentId: string
  toBusinessId: string
  boothId: string
  subject: string
  message: string
  attachments?: string[]
  status: 'unread' | 'read' | 'replied'
  createdAt: Date
  repliedAt?: Date
}

export interface InteractionLog {
  id: string
  studentId: string
  businessId: string
  boothId: string
  eventId: string
  type: 'check_in' | 'message' | 'application' | 'interview'
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

// ============= MATCHING & PREFERENCES =============

export interface StudentPreference {
  id: string
  studentId: string
  preferredIndustries: string[]
  preferredPositions: string[]
  preferredLocation?: string
  desiredSalaryMin?: number
  createdAt: Date
  updatedAt: Date
}

export interface MatchingScore {
  id: string
  studentId: string
  boothId: string
  score: number // 0-100
  factors: {
    skillMatch: number
    positionMatch: number
    locationMatch: number
    salaryMatch: number
  }
  calculatedAt: Date
}

// ============= REPORTING & ANALYTICS =============

export interface StudentCheckinReport {
  id: string
  eventId: string
  generatedAt: Date
  generatedBy: string // Admin ID
  data: {
    totalStudents: number
    totalCheckIns: number
    uniqueCheckInStudents: number
    boothwise: {
      boothId: string
      boothName: string
      checkInCount: number
      uniqueStudents: number
      averageDuration: number
    }[]
    timeAnalysis: {
      hour: number
      checkInCount: number
    }[]
    majorDistribution: {
      major: string
      count: number
    }[]
  }
}

export interface BoothReport {
  id: string
  boothId: string
  eventId: string
  generatedAt: Date
  generatedBy: string
  data: {
    totalVisitors: number
    uniqueVisitors: number
    totalInteractions: number
    applicationCount: number
    staffPerformance: {
      staffId: string
      staffName: string
      interactions: number
    }[]
    peakHours: {
      hour: number
      visitors: number
    }[]
    visitorsByMajor: {
      major: string
      count: number
    }[]
    followUpRequired: number
  }
}

// ============= USER ROLES & PERMISSIONS =============

export enum UserRole {
  STUDENT = 'student',
  BOOTH_STAFF = 'booth_staff',
  BUSINESS_ADMIN = 'business_admin',
  SCHOOL_ADMIN = 'school_admin',
  SYSTEM_ADMIN = 'system_admin',
}

export interface UserAccount {
  id: string
  email: string
  phone?: string
  role: UserRole
  status: 'active' | 'inactive' | 'suspended'
  linkedProfileId?: string // Link to StudentProfile, BoothStaff, or BusinessProfile
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AccessControl {
  role: UserRole
  permissions: {
    canViewStudents: boolean
    canExportData: boolean
    canManageBooths: boolean
    canViewAnalytics: boolean
    canManageApplications: boolean
    canScheduleInterviews: boolean
    canSendMessages: boolean
  }
}

// ============= FILE & EXPORT STRUCTURES =============

export interface ExportConfig {
  format: 'csv' | 'xlsx' | 'pdf'
  includeFields: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  filters?: {
    boothId?: string
    major?: string
    status?: string
  }
}

export interface ExportedFile {
  id: string
  generatedAt: Date
  generatedBy: string
  fileName: string
  format: string
  fileSize: number
  downloadUrl: string
  expiresAt: Date
}

// ============= EVENT STATISTICS =============

export interface EventStatistics {
  eventId: string
  totalRegisteredStudents: number
  totalAttendedStudents: number
  totalBooths: number
  totalPositions: number
  totalApplications: number
  totalInterviews: number
  averageCheckInsPerStudent: number
  peakHour: number
  mostVisitedBooth: string
  leastVisitedBooth: string
  majorsRepresented: number
  calculatedAt: Date
}
