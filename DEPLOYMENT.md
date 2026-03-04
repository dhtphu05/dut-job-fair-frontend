# DUT Job Fair Platform - Deployment & Configuration Guide

## Production Deployment Checklist

### Pre-Deployment Requirements

1. **Environment Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Verify build
   npm run build
   
   # Run tests
   npm run test
   ```

2. **Database Preparation**
   ```bash
   # Create production database
   createdb dut_job_fair_prod
   
   # Apply migrations
   npx prisma migrate deploy
   
   # Seed initial data
   npx prisma db seed
   ```

3. **Configuration Files**
   - Create `.env.production`
   - Set all required environment variables
   - Verify secrets are secure (no hardcoded values)

### Deployment Options

#### Option 1: Vercel Deployment (Recommended)

```bash
# 1. Connect repository to Vercel
vercel link

# 2. Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_API_URL

# 3. Deploy to production
vercel deploy --prod

# 4. Monitor deployment
vercel logs --tail
```

**Vercel Configuration (vercel.json):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"],
  "functions": {
    "api/**": {
      "maxDuration": 60,
      "memory": 512
    }
  },
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

#### Option 2: Self-Hosted (VPS/Cloud)

```bash
# 1. Build application
npm run build

# 2. Start production server
npm start

# 3. Use PM2 for process management
npm install -g pm2
pm2 start npm --name "job-fair" -- start
pm2 save
pm2 startup
```

**Nginx Configuration:**
```nginx
upstream nextjs {
  server localhost:3000;
}

server {
  listen 80;
  server_name jobfair.dut.edu.vn;

  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name jobfair.dut.edu.vn;

  ssl_certificate /etc/ssl/certs/jobfair.crt;
  ssl_certificate_key /etc/ssl/private/jobfair.key;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

  location / {
    proxy_pass http://nextjs;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

#### Option 3: Docker Deployment

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/dut_job_fair
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=dut_job_fair
      - POSTGRES_USER=jobfair
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jobfair"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## Production Configuration

### 1. Database Connection Pooling

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  return {
    query: (text: string, params?: any[]) => client.query(text, params),
    release: () => client.release(),
  };
}
```

### 2. Caching Strategy (Redis)

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl = 3600): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) return cached as T;

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache result
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### 3. Monitoring & Logging

```typescript
// lib/logger.ts
import * as Sentry from "@sentry/nextjs";
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'job-fair-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export { logger };

// Initialize Sentry for error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## Database Management

### Backup Strategy

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backups/dut-job-fair"
DATABASE="dut_job_fair_prod"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
pg_dump $DATABASE | gzip > "$BACKUP_FILE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

### Migration Management

```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Performance Optimization

### 1. Next.js Optimization

```typescript
// next.config.mjs
import withBundleAnalyzer from '@next/bundle-analyzer';

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withAnalyzer({
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    scrollRestoration: true,
  },
});
```

### 2. API Response Caching

```typescript
// app/api/route.ts
export async function GET(request: Request) {
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json',
    },
  });
}
```

## Security Hardening

### 1. HTTPS & TLS

```bash
# Using Let's Encrypt with Certbot
certbot certonly --standalone -d jobfair.dut.edu.vn

# Auto-renewal
certbot renew --dry-run
systemctl enable certbot.timer
systemctl start certbot.timer
```

### 2. Web Application Firewall (WAF)

Configure Cloudflare or AWS WAF:
- Block SQL injection attempts
- Rate limiting per IP
- Bot protection
- DDoS protection

### 3. Content Security Policy

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  return response;
}
```

## Monitoring & Alerts

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await query('SELECT 1');
    
    // Check Redis connection
    await redis.ping();
    
    return Response.json({ status: 'healthy' }, { status: 200 });
  } catch (error) {
    return Response.json({ status: 'unhealthy', error: error.message }, { status: 503 });
  }
}
```

### Uptime Monitoring

Use services like:
- UptimeRobot
- Statuspage.io
- DataDog
- New Relic

## Rollback Procedures

```bash
# Rollback to previous deployment
vercel rollback

# Database rollback
npx prisma migrate resolve --rolled-back "migration_name"

# Git rollback
git revert <commit-hash>
git push origin main
```

## Support & Maintenance

- **Documentation**: Keep README.md updated
- **Changelog**: Maintain CHANGELOG.md
- **Runbooks**: Create runbooks for common operations
- **On-call**: Establish on-call rotation
- **SLA**: Define response times for different severity levels
