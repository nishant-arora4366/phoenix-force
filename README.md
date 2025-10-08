# Phoenix Force Cricket Tournament Management System

A comprehensive cricket tournament management platform built with Next.js 15, Supabase, and Tailwind CSS.

## 🚀 Features

- **Tournament Management**: Create, manage, and monitor cricket tournaments with real-time updates
- **Player Profiles**: Comprehensive player profiles with configurable skills and attributes
- **Real-time Updates**: Live tournament updates with Supabase Realtime
- **Mobile Responsive**: Optimized for all device sizes with modern grey theme
- **Admin Panel**: Complete user, player, and skill management system
- **Waitlist System**: Automatic waitlist promotion with intelligent slot management
- **Role-based Access**: Admin, Host, Captain, and Player roles with proper permissions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Styling**: Tailwind CSS with custom grey theme
- **Authentication**: Supabase Auth with custom session management
- **Real-time**: Supabase Realtime subscriptions

## 📁 Project Structure

```
phoenix-force/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin panel pages
│   │   ├── page.tsx             # Main admin dashboard (3 tabs)
│   │   └── users/               # User management (legacy)
│   ├── api/                     # API Routes
│   │   ├── admin/               # Admin API endpoints
│   │   ├── auth/                # Authentication endpoints
│   │   ├── players/             # Player management APIs
│   │   └── tournaments/         # Tournament APIs
│   ├── auctions/                # Auction pages
│   ├── players/                 # Player pages
│   ├── tournaments/             # Tournament pages
│   ├── layout.tsx              # Root layout with navbar
│   └── page.tsx                 # Homepage
├── src/                          # Source code
│   ├── components/               # Reusable components
│   │   ├── AuthForm.tsx         # Authentication forms
│   │   ├── NavbarStatic.tsx     # Navigation component
│   │   └── PlayerProfilePrompt.tsx
│   ├── lib/                     # Utilities and services
│   │   ├── session.ts           # Session management
│   │   ├── supabaseClient.ts    # Supabase client
│   │   ├── permissions.ts       # Role-based permissions
│   │   └── auth.ts              # Authentication utilities
│   ├── types/                   # TypeScript definitions
│   └── utils/                   # Helper functions
├── supabase/                    # Database migrations
│   └── migrations/              # SQL migration files
├── styles/                      # Global styles
└── scripts/                     # Utility scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/phoenix-force.git
   cd phoenix-force
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   - Apply migrations from `supabase/migrations/`
   - Set up Row Level Security policies
   - Configure authentication

5. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ System Architecture

### Frontend Architecture
```
Next.js 15 App Router
├── Pages (app/)
│   ├── Static Pages (SSG)
│   ├── Dynamic Pages (SSR)
│   └── API Routes (Server-side)
├── Components (Reusable UI)
├── Libraries (Business Logic)
└── Styles (Tailwind CSS)
```

### Backend Architecture
```
Supabase Backend
├── PostgreSQL Database
├── Authentication Service
├── Real-time Subscriptions
├── Row Level Security (RLS)
└── Custom RPC Functions
```

## 🗄️ Database Design

### Core Entities

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  firstname TEXT,
  lastname TEXT,
  role TEXT DEFAULT 'player' CHECK (role IN ('admin', 'host', 'captain', 'player')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tournaments Table
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  total_slots INTEGER NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tournament Slots Table
```sql
CREATE TABLE tournament_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL,
  player_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'pending', 'confirmed', 'waitlist')),
  is_host_assigned BOOLEAN DEFAULT FALSE,
  requested_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔗 API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Login user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "player",
    "status": "approved"
  }
}
```

#### POST /api/auth/register
Register new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstname": "John",
  "lastname": "Doe"
}
```

### Tournament Endpoints

#### GET /api/tournaments
Get all tournaments.

**Response:**
```json
{
  "success": true,
  "tournaments": [
    {
      "id": "uuid",
      "name": "Summer Championship",
      "description": "Annual summer tournament",
      "start_date": "2024-06-01T00:00:00Z",
      "total_slots": 16,
      "status": "upcoming"
    }
  ]
}
```

#### POST /api/tournaments
Create new tournament.

**Request Body:**
```json
{
  "name": "Summer Championship",
  "description": "Annual summer tournament",
  "start_date": "2024-06-01T00:00:00Z",
  "total_slots": 16
}
```

#### POST /api/tournaments/[id]/register
Register for tournament.

**Request Body:**
```json
{
  "player_id": "uuid"
}
```

#### DELETE /api/tournaments/[id]/withdraw
Withdraw from tournament.

### Admin Endpoints

#### GET /api/admin/users
Get all users (admin only).

#### PUT /api/admin/users
Update user status or role.

**Request Body:**
```json
{
  "userId": "uuid",
  "status": "approved"
}
```

#### GET /api/admin/player-profiles
Get all player profiles.

#### GET /api/admin/player-skills
Get all player skills configuration.

#### POST /api/admin/player-skills
Add new player skill.

**Request Body:**
```json
{
  "skill": {
    "name": "Batting Style",
    "type": "select",
    "required": true,
    "displayOrder": 1,
    "isAdminManaged": false,
    "viewerCanSee": true
  }
}
```

## 🎯 Key Features

### Tournament Management
- **Dynamic Slot Creation**: Slots are created as players register
- **Real-time Updates**: Live updates using Supabase Realtime
- **Automatic Waitlist Promotion**: Players are automatically promoted when slots become available
- **Tournament Status Tracking**: Upcoming, active, completed, cancelled states

### Player Profiles
- **Comprehensive Profiles**: Display name, bio, profile picture
- **Configurable Skills**: Admin-configurable skill system with multiple types
- **Skill Types**: Select, text, number, multiselect
- **Profile Validation**: Admin approval system for profiles

### Admin Panel
The admin panel provides three main tabs:

#### 1. User Management
- **User Search**: Find users by email
- **Role Management**: Assign roles (admin, host, captain, player)
- **Status Management**: Approve/reject pending users
- **Password Reset**: Reset user passwords
- **User Filters**: Filter by status (all, pending, approved, rejected)

#### 2. Player Management
- **Profile Overview**: View all player profiles
- **Status Management**: Approve/reject player profiles
- **User Association**: Link profiles to user accounts
- **Mobile Responsive**: Optimized layouts for all devices

#### 3. Skill Management
- **Add Skills**: Create new player skills with full configuration
- **Edit Skills**: Modify existing skills and their properties
- **Delete Skills**: Remove skills with confirmation
- **Skill Values**: Manage individual skill values
- **Configuration Options**: Required, admin-managed, viewer visibility

### Waitlist System
- **Automatic Promotion**: Players are automatically promoted when slots become available
- **Real-time Updates**: Instant notifications when promoted
- **Intelligent Slot Management**: Dynamic slot creation and management
- **Position Tracking**: Clear waitlist position display

## 🔐 Authentication & Security

- **Supabase Authentication**: Secure user authentication
- **Custom Session Management**: Enhanced session handling
- **Row Level Security (RLS)**: Database-level security policies
- **Role-based Access Control**: Admin, Host, Captain, Player roles
- **Input Validation**: Comprehensive input validation
- **SQL Injection Protection**: Parameterized queries

## 📱 Mobile Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Touch Optimization**: Touch-friendly interactions
- **Adaptive Layouts**: Optimized for all screen sizes
- **Performance**: Optimized for mobile networks
- **Modern UI**: Clean, professional grey theme

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all required environment variables are set in production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Database Migrations
Apply all migrations from `supabase/migrations/` in order:
1. Core tables and relationships
2. Player skills schema
3. Admin management features
4. Auto-promotion system
5. Notifications system

## 🧪 Testing

The project includes comprehensive testing:
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Build Validation**: Production build testing
- **API Testing**: Endpoint validation

## 📊 Performance

- **Next.js 15 Optimizations**: Latest performance improvements
- **Static Generation**: Where possible for better performance
- **Code Splitting**: Automatic code splitting
- **Lazy Loading**: Component lazy loading
- **Optimized Assets**: Compressed images and assets

## 🔄 Recent Updates & Fixes

### Navbar Issues Fixed
- **Duplicate Navbars**: Removed duplicate navbar components
- **Navigation Links**: Restored all navigation menu items
- **Sign-in/Sign-out**: Fixed authentication button visibility
- **Mobile Responsive**: Optimized mobile navigation

### Admin Panel Enhancement
- **Complete Functionality**: All three tabs now have full functionality
- **User Management**: Complete user administration
- **Player Management**: Full player profile management
- **Skill Management**: Complete skill configuration system

### Waitlist System Improvements
- **Automatic Promotion**: Players automatically promoted when slots open
- **Real-time Updates**: Instant notifications and updates
- **Dynamic Slot Creation**: Slots created as needed
- **Intelligent Management**: Smart slot allocation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation above

---

**Phoenix Force Cricket** - Professional tournament management made simple.

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready