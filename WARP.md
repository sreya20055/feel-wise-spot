# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

BlindSpot is an accessible wellbeing and learning companion built with React, TypeScript, and Supabase. The application focuses on mood tracking, micro-learning courses, and AI-powered personalized suggestions, with accessibility as a core design principle.

**Technology Stack:**
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Build Tool**: Vite with SWC

## Development Commands

### Core Development
```bash
# Install dependencies
npm i

# Start development server (runs on localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Format code (if available, though not explicitly configured in package.json)
# Use your IDE's formatter or add prettier if needed
```

### Database Operations
```bash
# Navigate to Supabase directory for local development
cd supabase

# Note: Supabase CLI commands would go here if using local development
# Current setup uses hosted Supabase instance
```

## Architecture Overview

### Directory Structure
```
src/
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components (extensive collection)
│   └── AccessibilityToggle.tsx
├── contexts/           # React contexts for global state
│   ├── AuthContext.tsx      # Supabase authentication
│   └── AccessibilityContext.tsx  # User accessibility preferences
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/               # Utility functions
├── pages/             # Route components
│   ├── Index.tsx      # Landing page
│   ├── Auth.tsx       # Authentication
│   ├── Dashboard.tsx  # User dashboard
│   ├── MoodTracking.tsx
│   ├── Courses.tsx
│   ├── CourseDetail.tsx
│   └── NotFound.tsx
└── App.tsx            # Main application with routing
```

### Key Architectural Patterns

**Context-Based State Management:**
- `AuthContext`: Manages user authentication state with Supabase
- `AccessibilityContext`: Handles user accessibility preferences (font, contrast, size, voice navigation)

**Data Fetching:**
- React Query for server state management
- Supabase client for database operations
- Real-time subscriptions for live data updates

**Accessibility-First Design:**
- Custom accessibility context that persists to user profiles
- Dynamic CSS classes for font size, contrast, and dyslexic font
- Built-in accessibility toggle component
- OpenDyslexic font support via Tailwind extension

**UI Component System:**
- shadcn/ui components with Radix UI primitives
- Consistent design tokens via CSS variables
- Custom color scheme with wellbeing, mindfulness, and accessibility themes

## Database Schema (Supabase)

The application uses these key database tables:
- `profiles`: User profile data including accessibility preferences
- `mood_entries`: Daily mood tracking with descriptions and levels
- `micro_courses`: Learning content with duration and difficulty
- `course_progress`: User progress tracking with completion status

## Environment Configuration

**Required Environment Variables:**
- `VITE_SUPABASE_PROJECT_ID`: Supabase project identifier
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon key
- `VITE_SUPABASE_URL`: Supabase project URL

**Development Server:**
- Vite dev server configured to run on `localhost:8080`
- Host set to "::" for broader network access
- Auto-reload enabled with SWC for fast compilation

## Accessibility Features Implementation

When working with accessibility features:

1. **Font Preferences**: Use the `useAccessibility` hook to access user font preferences
2. **Theme Colors**: Leverage custom Tailwind colors (`wellbeing`, `mindfulness`, `accessibility`)
3. **Component Variants**: shadcn/ui components support consistent styling across themes
4. **Dynamic Classes**: Accessibility settings apply classes to document root for global effect

## Code Patterns to Follow

**Component Structure:**
```typescript
// Use React Query for data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id);
    if (error) throw error;
    return data;
  },
  enabled: !!user,
});
```

**Authentication Guards:**
```typescript
// Check auth state before rendering protected content
const { user, loading } = useAuth();

if (loading) {
  return <LoadingComponent />;
}

if (!user) {
  return <RedirectToAuth />;
}
```

**Accessibility Integration:**
```typescript
// Access user accessibility preferences
const { settings, updateSettings } = useAccessibility();

// Apply settings programmatically
updateSettings({ fontSize: 'large', contrast: 'high' });
```

## Testing Strategy

Currently, the project does not have a configured testing framework. When adding tests:
- Consider Vitest for unit testing (Vite-native)
- React Testing Library for component testing
- Playwright or Cypress for E2E testing of accessibility features

## Deployment

The application is configured for deployment through the Lovable platform:
- Production builds use `vite build`
- Development builds available via `vite build --mode development`  
- Preview builds via `vite preview`

## Development Notes

- This is a Lovable-generated project with automatic commits enabled
- The `lovable-tagger` plugin is used in development mode for component tagging
- Supabase integration uses localStorage for session persistence
- Path aliases configured: `@/` points to `src/` directory