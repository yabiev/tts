# Project Management System

## Overview

This is a full-stack project management application built with a modern tech stack. The system provides kanban-style project management with boards, tasks, and team collaboration features. It features a React frontend with TypeScript, Express.js backend, PostgreSQL database with Drizzle ORM, and comprehensive authentication using Passport.js.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using React with TypeScript and follows a modern component-based architecture:

- **UI Framework**: React with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Context-based auth provider with protected routes

The frontend uses a clean folder structure with components organized by feature and reusable UI components from shadcn/ui. The application implements a dark theme design system with custom CSS variables.

### Backend Architecture
The server follows a RESTful API design pattern:

- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Management**: PostgreSQL session store for persistent sessions
- **Password Security**: Scrypt-based password hashing with salt
- **API Structure**: Modular route handlers with proper error handling
- **Development**: Hot reload with tsx for development efficiency

The backend implements a clean separation of concerns with dedicated modules for authentication, database operations, and route handling.

### Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM:

- **Database**: Neon serverless PostgreSQL for scalability
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migration**: Drizzle Kit for database migrations
- **Schema Design**: Relational model with users, projects, boards, tasks, and team memberships
- **Data Validation**: Drizzle Zod for runtime schema validation

The database schema supports multi-tenancy through project ownership and team member relationships.

### Authentication and Authorization
Implements session-based authentication with role-based access:

- **Strategy**: Passport.js local strategy with email/password
- **Session Storage**: PostgreSQL-backed sessions for persistence
- **Password Security**: Scrypt hashing with timing-safe comparison
- **Authorization**: Role-based access (admin, manager, user)
- **Protected Routes**: Frontend route protection with auth context

### Component Design System
Uses shadcn/ui for consistent UI components:

- **Design Language**: Modern, accessible component library
- **Theming**: CSS custom properties for dark theme
- **Typography**: Inter font family with multiple weights
- **Icons**: Lucide React for consistent iconography
- **Responsive Design**: Mobile-first approach with responsive breakpoints

## External Dependencies

### Database Services
- **Neon**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit and query builder
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI and Styling
- **Radix UI**: Headless UI primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **class-variance-authority**: Utility for component variants

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: JavaScript bundler for production builds
- **tsx**: TypeScript execution for development

### State Management and Data Fetching
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation library

### Authentication
- **Passport.js**: Authentication middleware
- **Express Session**: Session management
- **Node.js crypto**: Password hashing utilities

### Additional Libraries
- **date-fns**: Date manipulation utilities
- **wouter**: Lightweight routing
- **cmdk**: Command palette component
- **embla-carousel**: Carousel component