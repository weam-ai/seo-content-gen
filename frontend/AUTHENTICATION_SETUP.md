# Authentication Integration Setup

This document explains how the authentication system has been integrated into the Razorcopy React application.

## Overview

The authentication system uses the following APIs:
- **Login**: `POST /auth/login`
- **Token Refresh**: `POST /auth/generate-token`
- **Logout**: `POST /auth/logout`

## Files Created/Modified

### 1. API Configuration (`src/lib/api.ts`)
- Centralized axios configuration with interceptors
- Automatic token management
- Automatic token refresh on 401 errors
- Error handling

### 2. Auth Service (`src/lib/services/auth.service.ts`)
- Service class for all authentication operations
- TypeScript interfaces for API requests/responses
- Error handling and user feedback

### 3. Auth Store (`src/stores/auth-store.ts`)
- Updated to include refresh token
- Enhanced user interface matching API response
- Persistent storage with Zustand

### 4. Login Component (`src/pages/auth/Login.tsx`)
- Integrated with auth service
- Loading states and error handling
- Form validation and user feedback

### 5. Sidebar Navigation (`src/components/ui/sidebar-nav.tsx`)
- Added logout functionality
- Dynamic user information display
- User avatar and initials

### 6. Main Layout (`src/components/layout/main-layout.tsx`)
- Integrated sidebar navigation
- Responsive layout adjustments

## Environment Setup

Create a `.env` file in the root directory with:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Replace with your actual API base URL.

## Usage

### Login
```typescript
import authService from '@/lib/services/auth.service';

const response = await authService.login({
  email: 'user@example.com',
  password: 'password'
});
```

### Logout
```typescript
await authService.logout();
```

### Check Authentication
```typescript
const isAuth = authService.isAuthenticated();
const user = authService.getCurrentUser();
```

## Features

- ✅ Automatic token refresh
- ✅ Persistent authentication state
- ✅ Error handling and user feedback
- ✅ Loading states
- ✅ TypeScript support
- ✅ Centralized API configuration
- ✅ Logout functionality
- ✅ User profile display

## API Response Structure

The system expects the following response structure from the login API:

```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "profile_image": "https://example.com/image.jpg",
      "role": {
        "code": "admin",
        "name": "Admin",
        "permissions": ["users.view", "users.create"]
      }
      // ... other user fields
    }
  }
}
```

## Testing

To test the authentication:

1. Set up your API base URL in `.env`
2. Navigate to `/login`
3. Use the provided credentials:
   - Email: `aayush.solanki@e2m.solutions`
   - Password: `Aayush@123`
4. The system will automatically handle token management and refresh

## Security Features

- Tokens are stored securely in browser storage
- Automatic token refresh prevents session expiration
- Logout clears all authentication data
- API interceptors handle authentication headers automatically 