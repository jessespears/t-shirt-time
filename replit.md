# T-Shirt Time - E-Commerce Platform

## Overview

T-Shirt Time is a custom e-commerce web application for selling beach-themed t-shirt designs inspired by New Jersey Shore culture. The platform enables customers to browse products, customize orders by size and color, manage a shopping cart, and complete purchases. It includes an admin dashboard for store owners to manage product inventory through an authenticated interface.

The application is designed with a casual, beach-lifestyle aesthetic that balances modern e-commerce functionality with a relaxed, approachable brand personality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server with HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing instead of React Router

**UI Component System:**
- shadcn/ui component library (New York style variant) built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Component aliases configured for clean imports (`@/components`, `@/lib`, `@/hooks`)

**Design System:**
- Typography: Google Fonts - Poppins (headings) and Inter (body text)
- Spacing: Consistent Tailwind spacing scale (4, 6, 8, 12, 16, 20, 24)
- Custom CSS variables for theming (primary, secondary, muted, accent, destructive colors)
- Beach/surf culture aesthetic with casual, approachable visual language

**State Management:**
- TanStack Query (React Query) for server state management and data fetching
- Local Storage for shopping cart persistence
- Custom event system (`cart-updated` events) for cart state synchronization across components

**Form Handling:**
- React Hook Form with Zod schema validation via @hookform/resolvers
- Type-safe form validation matching backend schema definitions

### Backend Architecture

**Server Framework:**
- Express.js server with TypeScript
- Custom middleware for request logging and JSON body parsing
- Raw body preservation for webhook handling (Stripe integration ready)

**Database & ORM:**
- PostgreSQL via Neon Database serverless driver (@neondatabase/serverless)
- Drizzle ORM for type-safe database queries
- Schema-first approach with shared types between frontend and backend
- Connection pooling for production scalability

**Database Schema:**
- `sessions`: Session storage for authentication (required for Replit Auth)
- `users`: User profiles with email, name, and profile image
- `products`: Product catalog with name, description, price, images, available sizes/colors
- `orders`: Order records with customer information, shipping details, line items, and totals

**Authentication & Authorization:**
- Replit Auth integration using OpenID Connect (OIDC)
- Passport.js strategy for OAuth flow
- Session-based authentication with PostgreSQL session store (connect-pg-simple)
- Role-based access control (RBAC) for admin features
  - `isAdmin` middleware protects admin-only routes (product management, order management)
  - New users default to non-admin (isAdmin = 0)
  - Admin status persists across logins
- Session TTL: 1 week with automatic refresh

**Granting Admin Access:**
To grant admin privileges to a user, use the Replit Database tool or execute this SQL:
```sql
UPDATE users SET is_admin = 1 WHERE email = 'your-email@example.com';
```
Note: Users must log in at least once before they can be granted admin access.

**API Design:**
- RESTful endpoints under `/api` prefix
- Standardized error handling with HTTP status codes
- Public asset serving via `/public-objects` and `/objects` routes
- CRUD operations for products (admin only)
- Order creation and retrieval endpoints

**Storage Architecture:**
- Google Cloud Storage integration for product images and assets
- Custom ACL (Access Control List) system for object-level permissions
- Object metadata storage for ownership and visibility (public/private)
- Presigned URL generation for secure uploads via Uppy
- Public object search paths configurable via environment variables

### External Dependencies

**Cloud Services:**
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Cloud Storage**: Object storage for product images and media files
- **Replit Deployment**: Infrastructure sidecar services for authentication and storage credentials

**File Upload:**
- **Uppy**: File upload library with dashboard UI and AWS S3-compatible adapter
- Supports drag-and-drop, progress tracking, and client-side file validation
- Max file size: 10MB per upload (configurable)

**Payment Processing:**
- Architecture prepared for Stripe integration (webhook endpoint structure in place)
- Order schema includes fields for payment tracking

**Google Fonts:**
- Poppins (weights: 600, 700) for headings
- Inter (weights: 400, 500, 600) for body text
- Preconnected in HTML for optimal loading performance

**Development Tools:**
- Replit-specific plugins for development:
  - Runtime error overlay
  - Cartographer (code mapping)
  - Dev banner
- ESBuild for production server bundling
- Drizzle Kit for database migrations

**Environment Configuration:**
- Required: `DATABASE_URL`, `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`
- Optional: `PUBLIC_OBJECT_SEARCH_PATHS` for asset management
- Production/development mode switching via `NODE_ENV`