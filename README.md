# DUT Job Fair 2025 - Management System

A modern, interactive web application for managing the DUT Job Fair 2025. Features a QR code scanner for visitor tracking and dual admin dashboards for school and business administrators.

## Features

### 1. QR Code Scanner (PWA)
- Real-time QR code scanning with camera integration
- Visitor information display on successful scan
- Recent scans history with status tracking
- Mobile-first responsive design
- Works offline with PWA capabilities

### 2. School Admin Dashboard
- Event-wide analytics and statistics
- Booth overview with visitor counts
- Prize management system (Early Bird, Lucky Draw, Booth Special)
- Real-time scan trends and peak hour analysis
- Data export functionality

### 3. Business Admin Dashboard
- Booth-specific visitor statistics
- Visitor list with search and filtering
- Weekly and hourly trend analysis
- CSV export for visitor data
- Performance metrics

### 4. Authentication System
- Role-based access control (School Admin, Business Admin)
- Secure login with token-based authentication
- Auto-logout functionality

### 5. API Integration Layer
- Centralized API client with token handling and consistent error processing
- Typed API hooks generated from OpenAPI schema using Orval
- React Query based server-state caching and request lifecycle handling
- Ready-to-switch architecture between mock data and live backend APIs

## Technology Stack

- **Framework**: Next.js 16 + React 19 + TypeScript
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS 4 + PostCSS
- **Data Fetching**: TanStack React Query
- **Forms & Validation**: React Hook Form + Zod
- **HTTP Client**: Fetch wrapper + Axios mutator for generated clients
- **API Codegen**: Orval (OpenAPI -> typed React Query hooks)
- **Charts & Visualization**: Recharts
- **QR Scanning**: html5-qrcode, qr-scanner
- **Icons**: Lucide React
- **State Management**: React Hooks + Custom Hooks

## Project Structure

```
app/
├── (auth)/
│   ├── login/                 # Login page with role selection
│   └── layout.tsx             # Auth layout wrapper
├── scanner/                   # QR scanner module
│   └── page.tsx              # Scanner main page
├── school-admin/             # School admin dashboard
│   ├── page.tsx              # Dashboard main page
│   └── layout.tsx            # Admin layout with header
├── business-admin/           # Business admin dashboard
│   ├── page.tsx              # Dashboard main page
│   └── layout.tsx            # Admin layout with header
├── page.tsx                  # Home page with navigation
├── layout.tsx                # Root layout
└── globals.css               # Global styles with design tokens

components/
├── ui/                       # shadcn/ui components
├── scanner/
│   ├── QrScanner.tsx         # QR scanner component
│   ├── ScanResultModal.tsx   # Scan result display
│   ├── RecentScans.tsx       # Recent scans list
│   └── VisitorCounter.tsx    # Visitor count display
├── school-admin/
│   ├── StatsCard.tsx         # Stats display card
│   ├── BoothsTable.tsx       # Booths overview table
│   ├── PrizesSection.tsx     # Prize management
│   └── ScanChart.tsx         # Charts and trends
└── business-admin/
    ├── VisitorsList.tsx      # Visitor table with export
    └── BoothTrendsChart.tsx  # Trend visualization

lib/
├── constants.ts              # API endpoints and constants
├── api-client.ts             # HTTP client with auth
├── types.ts                  # TypeScript interfaces
└── utils.ts                  # Utility functions

hooks/
└── useApi.ts                 # Custom hook for API calls
```

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dut-job-fair-2025

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000` in your browser.

## Backend Integration

The application is currently using **mock data** for demonstration. To connect it to your backend:

### 1. Update API Endpoints

Edit `lib/constants.ts` and update the `API_BASE_URL`:

```typescript
export const API_BASE_URL = 'https://your-api-domain.com/api'
```

### 2. Enable API Calls

Each component has commented-out API calls. Uncomment them to use real data:

```typescript
// In scanner/page.tsx
const response = await apiClient.post(SCANNER_ENDPOINTS.SCAN, {
  visitorCode,
  boothId,
})
```

### 3. Authentication

The auth token is stored in localStorage. For production, consider using:
- HttpOnly cookies
- Refresh token rotation
- Secure session management

## API Endpoints

The following endpoints are configured in `lib/constants.ts`:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Scanner
- `POST /scanner/scan` - Record a scan
- `GET /scanner/scans` - Get all scans
- `GET /scanner/recent-scans` - Get recent scans

### School Admin
- `GET /school-admin/dashboard` - Dashboard data
- `GET /school-admin/stats` - Statistics
- `GET /school-admin/export` - Export data

### Business Admin
- `GET /business-admin/dashboard` - Dashboard data
- `GET /business-admin/booth/:boothId` - Booth stats
- `POST /business-admin/export-visitors` - Export visitors

## Design System

### Color Palette
- **Primary**: DUT Blue (#3B82F6)
- **Background**: White (#FFFFFF)
- **Foreground**: Dark Gray (#1F2937)
- **Accents**: Primary blue shades

### Typography
- **Font Family**: Inter (sans-serif)
- **Mono Font**: JetBrains Mono (monospace)
- **Heading**: Bold weights (600-700)
- **Body**: Regular weight (400)

### Spacing & Layout
- Uses Tailwind's spacing scale
- Mobile-first responsive design
- Flexbox-based layouts

## Testing

Test credentials for demo login:

```
School Admin:
Email: admin@dut.edu.vn
Password: password123

Business Admin:
Email: company@example.com
Password: password123
```

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## PWA Configuration

The application is ready for PWA deployment. To enable:

1. Add `next-pwa` package
2. Update `next.config.js` with PWA config
3. Create service worker configuration

## Performance Optimization

- Image optimization with Next.js Image component
- Component code splitting
- Client-side caching with SWR
- Efficient table rendering with virtualization (optional)

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is proprietary software for DUT Job Fair 2025.

## Support

For issues or questions:
- Check the API integration guide in `lib/constants.ts`
- Review component documentation in respective files
- Refer to shadcn/ui docs: https://ui.shadcn.com
- Check Recharts documentation: https://recharts.org

## Changelog

### v1.0.0
- Initial release
- QR scanner module
- School admin dashboard
- Business admin dashboard
- Authentication system
- API integration layer
