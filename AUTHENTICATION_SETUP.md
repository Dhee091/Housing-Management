# Firebase Authentication Setup Guide

## Overview

This guide covers the complete Firebase authentication setup for the Estate Management application, including email/password and Google OAuth2 authentication with user role persistence in Firestore.

## Architecture

### Component Layers

```
┌─────────────────────────────────────────────┐
│   UI Components (LoginPage, RegisterPage)   │
├─────────────────────────────────────────────┤
│              useAuth() Hook                 │
├─────────────────────────────────────────────┤
│           AuthContext + AuthProvider        │
├─────────────────────────────────────────────┤
│  FirebaseAuthService  │  UsersService       │
├─────────────────────────────────────────────┤
│  Firebase Auth SDK    │  Firebase Firestore │
└─────────────────────────────────────────────┘
```

## Files Created

### 1. Authentication Service (`src/services/auth/authService.ts`)

Encapsulates Firebase Authentication operations:

**Key Methods:**

- `registerWithEmail(email, password)` - Create new user account
- `loginWithEmail(email, password)` - Sign in with email/password
- `loginWithGoogle()` - Sign in with Google popup
- `sendPasswordReset(email)` - Send password reset email
- `logout()` - Sign out user
- `onAuthStateChanged(callback)` - Listen to auth state changes
- `getCurrentUser()` - Get current authenticated user

**Error Handling:**
All Firebase auth errors are mapped to user-friendly messages:

- `auth/email-already-in-use` → "This email is already in use"
- `auth/weak-password` → "Password must be at least 6 characters"
- `auth/user-not-found` → "No account found with this email"
- `auth/wrong-password` → "Incorrect password"
- `auth/invalid-email` → "Please enter a valid email address"

**Session Persistence:**
Enabled by default via `browserLocalPersistence` - users stay logged in across page refreshes.

### 2. Users Service (`src/services/auth/usersService.ts`)

Manages user profiles in Firestore `/users/{uid}` collection:

**Key Methods:**

- `createUser(uid, email, displayName, role)` - Create user profile
- `getUser(uid)` - Fetch user profile from Firestore
- `updateUser(uid, updates)` - Update user profile
- `updateUserRole(uid, role)` - Change user role (admin only)
- `deleteUserData(uid)` - Delete user profile (doesn't delete auth account)
- `deactivateUser(uid)` - Soft delete (mark as inactive)
- `reactivateUser(uid)` - Re-enable inactive account

**Firestore Collection Structure:**

```
/users/{uid}
├── uid: string (matches Firebase Auth UID)
├── email: string
├── displayName: string
├── photoURL: string | null
├── role: 'agent' | 'owner' | 'admin'
├── createdAt: Timestamp
├── updatedAt: Timestamp
├── phone?: string
├── company?: string
├── bio?: string
└── isActive: boolean
```

**User Roles:**

- `owner` - Property owner (default for new users)
- `agent` - Real estate agent
- `admin` - System administrator

### 3. Auth Context (`src/context/AuthContext.tsx`)

App-level authentication state management:

**State:**

- `currentUser` - Firebase Auth user (uid, email, displayName, photoURL, emailVerified)
- `user` - User profile from Firestore (includes role)
- `userRole` - User's role (agent, owner, admin)
- `loading` - Authentication operation in progress
- `error` - Error message (or null)

**Methods:**

- `login(email, password)` - Sign in
- `loginWithGoogle()` - Google sign-in
- `register(email, password, displayName, role)` - Register new account
- `logout()` - Sign out
- `resetPassword(email)` - Send password reset email
- `clearError()` - Clear error state

**Key Features:**

- Auto-detects session on app startup via `onAuthStateChanged()`
- Auto-creates Firestore user profile on Google sign-in (role: owner)
- Returns unsubscribe function for cleanup
- Session persistence enabled by default

### 4. useAuth Hook (`src/hooks/useAuth.ts`)

Convenient hook for components to access AuthContext:

```typescript
const { currentUser, userRole, loading, error, login, logout } = useAuth();
```

Throws helpful error if used outside `AuthProvider`.

### 5. Firebase Config Update (`src/config/firebase.ts`)

Updated to initialize Firebase Auth and connect to Auth Emulator:

```typescript
// Auth initialization happens automatically
// when authService is instantiated

// Emulator connection (dev only)
if (VITE_REACT_APP_USE_FIREBASE_EMULATOR === "true") {
  connectAuthEmulator(getAuth(app), "http://localhost:9099", {
    disableWarnings: true,
  });
}
```

### 6. Login Page (`src/pages/LoginPage.tsx`)

User login interface with:

- Email/password form
- Google sign-in button
- Error display
- Link to registration page
- Loading state management

### 7. Register Page (`src/pages/RegisterPage.tsx`)

User registration interface with:

- Full name field
- Email/password form
- Password confirmation
- Role selector (Owner/Agent)
- Google sign-up button
- Form validation
- Error display

## Setup Instructions

### Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** > **Sign-in method**
4. Enable:
   - **Email/Password** - Click Enable
   - **Google** - Click Enable

### Step 2: Configure Google OAuth2

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google**
3. Add authorized domains:
   - `localhost:5173` (for local development)
   - `localhost:3000` (if using different dev port)
   - `yourdomain.com` (for production)
4. Enable Google sign-in scope for:
   - Email
   - Profile

### Step 3: Deploy Firestore Security Rules

1. Go to **Firestore Database** > **Rules** tab
2. Copy content from `firestore.rules` file
3. Click **Publish**

**Important:** Replace the entire rules content with the provided rules to ensure proper security.

### Step 4: Create /users Collection (Optional)

Firebase will automatically create the collection when the first user is saved. However, you can create it manually:

1. Go to **Firestore Database**
2. Click **+ Start collection**
3. Collection ID: `users`
4. Click **Auto ID** for document ID
5. Add sample fields or skip (will be created on registration)

### Step 5: Environment Variables

Ensure your `.env` file has:

```env
VITE_REACT_APP_FIREBASE_API_KEY=your_api_key
VITE_REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_REACT_APP_FIREBASE_PROJECT_ID=your_project_id
VITE_REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_REACT_APP_FIREBASE_APP_ID=your_app_id
VITE_REACT_APP_USE_FIREBASE_EMULATOR=false # Set to 'true' for local testing
```

### Step 6: Integration in App

The app is already integrated with `AuthProvider` in `App.tsx`:

```typescript
<AuthProvider>
  <Router>
    {/* Routes */}
  </Router>
</AuthProvider>
```

## Usage in Components

### Access Authentication State

```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { currentUser, userRole, loading, error } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!currentUser) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {currentUser.displayName}</p>
      <p>Your role: {userRole}</p>
    </div>
  );
}
```

### Perform Authentication Actions

```typescript
const { login, logout, register, error } = useAuth();

// Login
const handleLogin = async (email, password) => {
  try {
    await login(email, password);
    // Navigation happens automatically
  } catch (err) {
    // Error is set in context
  }
};

// Register
const handleRegister = async (email, password, name, role) => {
  try {
    await register(email, password, name, role);
    // Navigates to home
  } catch (err) {
    // Error handling
  }
};

// Logout
const handleLogout = async () => {
  try {
    await logout();
  } catch (err) {
    // Error handling
  }
};
```

### Create Protected Routes

```typescript
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}

// Usage in App.tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  }
/>
```

## Testing

### Local Testing with Firebase Emulator

1. Install Firebase CLI (if not already installed):

   ```bash
   npm install -g firebase-tools
   ```

2. Start the emulator:

   ```bash
   firebase emulators:start
   ```

3. Set environment variable:

   ```
   VITE_REACT_APP_USE_FIREBASE_EMULATOR=true
   ```

4. Start your dev server:
   ```bash
   npm run dev
   ```

### Test Scenarios

**Email/Password Registration:**

1. Go to `/register`
2. Enter test email (e.g., test@example.com)
3. Enter password (min 6 characters)
4. Select role (Owner/Agent)
5. Click "Create Account"
6. User should be created in Auth and Firestore

**Email/Password Login:**

1. Go to `/login`
2. Enter email and password
3. Click "Sign In"
4. User profile should be fetched from Firestore
5. Redirects to home page

**Google Sign-In:**

1. Click "Sign in with Google"
2. Select Google account
3. First-time users: profile created in Firestore with role: owner
4. Existing users: profile fetched from Firestore
5. Redirects to home page

**Session Persistence:**

1. Log in with any method
2. Refresh the page
3. User should remain logged in
4. Close and reopen browser
5. User should still be logged in

## Error Handling

All authentication errors are caught and mapped to user-friendly messages:

**Registration Errors:**

- Email already in use
- Weak password
- Invalid email format

**Login Errors:**

- User not found
- Wrong password
- Invalid credentials

**Google Sign-In Errors:**

- Popup blocked
- Sign-in cancelled
- Network error

**Firestore Errors:**

- Permission denied
- Network error
- Document not found

## Security Best Practices

✅ **Implemented:**

- Session persistence via `browserLocalPersistence`
- Role-based access control in Firestore rules
- User-friendly error messages (no sensitive data)
- Automatic logout on authentication errors
- Soft delete for user accounts (preserve data)
- Email verification ready (can be added)

⚠️ **Recommended to Add:**

- Email verification before account access
- Multi-factor authentication (MFA)
- Rate limiting on login attempts
- Password strength validation UI feedback
- Email change verification
- Account deactivation/deletion flows
- Admin dashboard for user management
- Audit logging for role changes

## Troubleshooting

**"useAuth must be used within an AuthProvider"**

- Ensure `<AuthProvider>` wraps your component tree
- Check `App.tsx` has the provider

**"No credentials object was found in the arguments"**

- Make sure `VITE_REACT_APP_USE_FIREBASE_EMULATOR=false` in production
- Set to `true` only for local development with emulator

**Google sign-in button not working**

- Verify Google is enabled in Firebase Console
- Check authorized domains include your dev domain
- Clear browser cache and cookies
- Try incognito mode

**User profile not created in Firestore**

- Check Firestore rules are deployed
- Verify `/users` collection exists
- Check cloud functions logs if using them
- Ensure `UsersService.createUser()` is called during registration

**Session not persisting**

- Ensure `browserLocalPersistence` is enabled in `authService.ts`
- Check browser's local storage is not cleared
- Verify user document exists in Firestore
- Try clearing cache and logging in again

## Next Steps

1. **Email Verification** - Send verification email on registration
2. **Password Reset Flow** - Implement password reset page
3. **User Profile Editor** - Let users update their information
4. **Admin Dashboard** - Manage users and their roles
5. **Two-Factor Authentication** - Add MFA for security
6. **Social Login** - Add GitHub, Facebook, other providers
7. **API Rate Limiting** - Prevent abuse of auth endpoints

## Related Documentation

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [React Context API](https://react.dev/learn/passing-data-deeply-with-context)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
