# DUT Job Fair Platform - Implementation Guide

## Table of Contents
1. [PWA Configuration](#pwa-configuration)
2. [Database Design](#database-design)
3. [API Integration Architecture](#api-integration-architecture)
4. [External System Communication](#external-system-communication)
5. [Performance Optimization](#performance-optimization)
6. [Security Considerations](#security-considerations)
7. [Deployment Guidelines](#deployment-guidelines)

---

## PWA Configuration

### 1. Web App Manifest Setup

Create `public/manifest.json`:

```json
{
  "name": "DUT Job Fair 2025",
  "short_name": "Job Fair DUT",
  "description": "Hệ thống quản lý sự kiện tuyển dụng của Đại học Duy Tân",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "shortcuts": [
    {
      "name": "Quét QR Code",
      "short_name": "Quét",
      "description": "Mở chức năng quét QR code",
      "url": "/scanner",
      "icons": [
        {
          "src": "/icons/scanner-icon.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Quản lý sự kiện",
      "short_name": "Sự kiện",
      "description": "Truy cập bảng điều khiển quản lý",
      "url": "/school-admin",
      "icons": [
        {
          "src": "/icons/admin-icon.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

### 2. Update `app/layout.tsx` for PWA

Add manifest and PWA metadata:

```tsx
export const metadata: Metadata = {
  title: 'DUT Job Fair 2025',
  description: 'Hệ thống quản lý sự kiện tuyển dụng',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DUT Job Fair 2025',
  },
  formatDetection: {
    telephone: false,
  },
}
```

### 3. Service Worker Configuration

Create `public/sw.js`:

```javascript
const CACHE_NAME = 'dut-job-fair-v1';
const URLS_TO_CACHE = [
  '/',
  '/app.js',
  '/styles.css',
  '/scanner',
  '/school-admin',
  '/business-admin',
  '/offline.html'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((response) => response || caches.match('/offline.html'));
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-checkins') {
    event.waitUntil(syncCheckins());
  }
});

async function syncCheckins() {
  try {
    const db = await openDatabase();
    const pendingScans = await db.getAll('pending_scans');
    
    for (const scan of pendingScans) {
      await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scan),
      });
      await db.delete('pending_scans', scan.id);
    }
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}
```

### 4. Register Service Worker in Next.js

Create `app/providers.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

export function Providers({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Every minute
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return <>{children}</>;
}
```

---

## Database Design

### 1. PostgreSQL Schema

```sql
-- Schools Table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  logo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT schools_unique_code UNIQUE (code)
);

-- Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  major VARCHAR(100),
  year INT CHECK (year BETWEEN 1 AND 4),
  avatar_url VARCHAR(500),
  qr_code VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT students_unique_code UNIQUE (student_code, school_id)
);

-- Businesses Table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(500),
  logo_url VARCHAR(500),
  description TEXT,
  industry VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booths Table
CREATE TABLE booths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(100),
  staff_name VARCHAR(255),
  contact_phone VARCHAR(20),
  qr_code VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT booths_unique_position UNIQUE (event_id, position)
);

-- Check-ins Table
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_minutes INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications Table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  resume_url VARCHAR(500),
  cover_letter TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT applications_unique UNIQUE (student_id, business_id)
);

-- Communications Table
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_type VARCHAR(20), -- 'student', 'business', 'school'
  sender_id UUID NOT NULL,
  receiver_type VARCHAR(20),
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachment_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_sender_type CHECK (sender_type IN ('student', 'business', 'school')),
  CONSTRAINT valid_receiver_type CHECK (receiver_type IN ('student', 'business', 'school'))
);

-- Prizes Table
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'early_bird', 'lucky_draw', 'booth_special'
  description TEXT,
  quantity INT NOT NULL DEFAULT 1,
  qualification_rule TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prize Winners Table
CREATE TABLE prize_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT winners_unique UNIQUE (prize_id, student_id)
);

-- Create Indexes for Performance
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_code ON students(student_code);
CREATE INDEX idx_checkins_student ON checkins(student_id);
CREATE INDEX idx_checkins_booth ON checkins(booth_id);
CREATE INDEX idx_checkins_time ON checkins(check_in_time);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_business ON applications(business_id);
CREATE INDEX idx_communications_sender ON communications(sender_id);
CREATE INDEX idx_communications_receiver ON communications(receiver_id);
CREATE INDEX idx_prize_winners_student ON prize_winners(student_id);
```

### 2. IndexedDB Schema (Client-side Offline Storage)

```typescript
// lib/db-client.ts
export const DB_CONFIG = {
  name: 'DUTJobFairDB',
  version: 1,
  stores: {
    students: {
      keyPath: 'id',
      indexes: [
        { name: 'studentCode', unique: true },
        { name: 'email', unique: true },
      ],
    },
    booths: {
      keyPath: 'id',
      indexes: [
        { name: 'businessId', unique: false },
      ],
    },
    checkins: {
      keyPath: 'id',
      indexes: [
        { name: 'studentId', unique: false },
        { name: 'boothId', unique: false },
        { name: 'checkInTime', unique: false },
      ],
    },
    pendingScans: {
      keyPath: 'id',
      indexes: [
        { name: 'synced', unique: false },
        { name: 'timestamp', unique: false },
      ],
    },
  },
};
```

---

## API Integration Architecture

### 1. RESTful API Endpoints

```
POST   /api/auth/login              # User authentication
POST   /api/auth/logout             # User logout
POST   /api/auth/refresh            # Refresh token

GET    /api/students                # List students
GET    /api/students/:id            # Get student details
POST   /api/students                # Create student
PUT    /api/students/:id            # Update student
DELETE /api/students/:id            # Delete student

GET    /api/booths                  # List booths
GET    /api/booths/:id              # Get booth details
POST   /api/booths                  # Create booth
PUT    /api/booths/:id              # Update booth

GET    /api/checkins                # List check-ins
POST   /api/checkins                # Create check-in
GET    /api/checkins/student/:id    # Get student's check-ins
GET    /api/checkins/booth/:id      # Get booth's check-ins

GET    /api/applications            # List applications
POST   /api/applications            # Create application
PUT    /api/applications/:id        # Update application status

GET    /api/communications          # List messages
POST   /api/communications          # Send message
POST   /api/communications/:id/read # Mark as read

GET    /api/prizes                  # List prizes
GET    /api/prizes/:id/winners      # Get prize winners
POST   /api/prizes/:id/claim        # Claim prize

GET    /api/reports/attendance      # Generate attendance report
GET    /api/reports/engagement      # Generate engagement report
GET    /api/reports/statistics      # Generate statistics report
```

### 2. API Client Wrapper

```typescript
// lib/api-client.ts
class APIClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL) {
    this.baseURL = baseURL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
```

### 3. Request/Response Standardization

```typescript
// lib/api-types.ts
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateResponse<T> {
  id: string;
  data: T;
  createdAt: string;
}
```

---

## External System Communication

### 1. Third-party Integration Points

```typescript
// lib/integrations.ts

// LinkedIn Learning Integration
export const linkedInIntegration = {
  endpoint: 'https://api.linkedin.com/v2',
  scope: ['r_liteprofile', 'r_emailaddress'],
  getProfile: async (accessToken: string) => {
    // Fetch LinkedIn profile data
  },
};

// Email Service (SendGrid/AWS SES)
export const emailService = {
  send: async (to: string, subject: string, template: string, data: any) => {
    // Send email with template
  },
};

// SMS Service (Twilio)
export const smsService = {
  send: async (phone: string, message: string) => {
    // Send SMS
  },
};

// Payment Gateway (Stripe/VNPay)
export const paymentService = {
  createPayment: async (amount: number, description: string) => {
    // Create payment intent
  },
};

// Google Calendar Integration
export const calendarService = {
  createEvent: async (event: CalendarEvent) => {
    // Create calendar event for job fair
  },
};
```

### 2. Webhook Handling

```typescript
// app/api/webhooks/route.ts
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: Request) {
  const headersList = headers();
  const signature = headersList.get('x-webhook-signature');
  const body = await req.json();

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET || '')
    .update(JSON.stringify(body))
    .digest('hex');

  if (hash !== signature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Handle webhook based on type
  switch (body.type) {
    case 'payment.completed':
      await handlePaymentCompleted(body.data);
      break;
    case 'student.registered':
      await handleStudentRegistered(body.data);
      break;
    case 'booth.created':
      await handleBoothCreated(body.data);
      break;
  }

  return Response.json({ success: true });
}
```

### 3. Data Synchronization Strategy

```typescript
// lib/sync-manager.ts
export class SyncManager {
  private syncQueue: SyncTask[] = [];
  private isSyncing = false;

  async addTask(task: SyncTask) {
    this.syncQueue.push(task);
    if (!this.isSyncing) {
      await this.processSyncQueue();
    }
  }

  private async processSyncQueue() {
    this.isSyncing = true;
    
    while (this.syncQueue.length > 0) {
      const task = this.syncQueue.shift();
      if (!task) continue;

      try {
        await this.executeTask(task);
        task.status = 'completed';
      } catch (error) {
        task.status = 'failed';
        task.retryCount = (task.retryCount || 0) + 1;
        
        if (task.retryCount < 3) {
          this.syncQueue.push(task);
        }
      }
    }
    
    this.isSyncing = false;
  }

  private async executeTask(task: SyncTask) {
    // Execute sync task based on type
  }
}
```

---

## Performance Optimization

### 1. Image Optimization

```tsx
// Use Next.js Image component
import Image from 'next/image';

export function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={640}
      height={480}
      quality={75}
      priority={false}
      loading="lazy"
    />
  );
}
```

### 2. Code Splitting

```typescript
// Use dynamic imports for large components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { loading: () => <div>Loading...</div> }
);
```

### 3. Database Query Optimization

```typescript
// Use connection pooling
import { Pool } from 'pg';

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Security Considerations

### 1. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
WEBHOOK_SECRET=webhook-secret
API_RATE_LIMIT=100
SESSION_TIMEOUT=3600
```

### 2. CORS Configuration

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
```

### 3. Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

---

## Deployment Guidelines

### 1. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

### 2. Docker Containerization

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 3. Database Migration

```bash
# Create migration
npx prisma migrate dev --name add_students

# Deploy migration
npx prisma migrate deploy
```

### 4. Performance Monitoring

```typescript
// lib/monitoring.ts
import { captureException, captureMessage } from '@sentry/nextjs';

export function logError(error: Error, context?: Record<string, any>) {
  captureException(error, { extra: context });
}

export function logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  captureMessage(message, level);
}
```

---

## Quick Start Checklist

- [ ] Configure Web App Manifest
- [ ] Set up Service Worker
- [ ] Create PostgreSQL database
- [ ] Set up IndexedDB for offline support
- [ ] Configure API endpoints
- [ ] Implement authentication flow
- [ ] Set up CORS and security headers
- [ ] Configure environment variables
- [ ] Set up database migrations
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Test PWA installation
- [ ] Deploy to production

---

## Additional Resources

- [Web.dev - PWA Guide](https://web.dev/progressive-web-apps/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
