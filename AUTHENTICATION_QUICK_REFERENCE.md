# Authentication - Quick Reference Guide

## Quick Start

### For Users

1. Visit `/register` to create account
2. Or visit `/login` if you already have an account
3. Use email/password or Google sign-in
4. Get redirected to home after success

### For Developers

**Use Auth in Components:**

```typescript
import { useAuth } from "./hooks/useAuth";

function MyComponent() {
  const { currentUser, userRole, loading, error, login, logout } = useAuth();

  // currentUser: { uid, email, displayName, photoURL, emailVerified } | null
  // userRole: 'agent' | 'owner' | 'admin' | null
  // loading: boolean
  // error: string | null
}
```

**Create Protected Routes:**

```typescript
import { useAuth } from './hooks/useAuth';
import { Navigate } from 'react-router-dom';

function AdminOnly({ children }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  if (userRole !== 'admin') return <Navigate to="/" />;

  return children;
}
```

**Trigger Login/Logout:**

```typescript
const { login, logout } = useAuth();

// Login
await login("user@example.com", "password");

// Logout
await logout();
```

## File Locations

```
src/services/auth/authService.ts    - Firebase Auth operations
src/services/auth/usersService.ts   - Firestore user profiles
src/context/AuthContext.tsx         - Auth state management
src/hooks/useAuth.ts               - Auth context hook
src/pages/LoginPage.tsx            - Login form
src/pages/RegisterPage.tsx         - Registration form
firestore.rules                    - Security rules
AUTHENTICATION_SETUP.md            - Full setup guide
AUTHENTICATION_SUMMARY.md          - Implementation details
```

## Authentication Flow

### Email/Password Registration

```
User fills form → Validate → Create Firebase Auth account
                                    ↓
                        Create Firestore user profile
                                    ↓
                        Set context state → Redirect home
```

### Email/Password Login

```
User enters credentials → Validate → Sign in with Firebase Auth
                                              ↓
                                    Fetch user profile from Firestore
                                              ↓
                                    Set context state → Redirect home
```

### Google Sign-In

```
User clicks Google button → Popup auth → Check if user exists
                                                    ↓
                                    If new: Create profile (role: owner)
                                    If exists: Fetch profile
                                                    ↓
                                    Set context state → Redirect home
```

## Environment Variables

```env
# Firebase Config
VITE_REACT_APP_FIREBASE_API_KEY=your_key
VITE_REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
VITE_REACT_APP_FIREBASE_PROJECT_ID=your_project
VITE_REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_REACT_APP_FIREBASE_APP_ID=your_app_id

# Local Emulator (set to 'true' for local testing)
VITE_REACT_APP_USE_FIREBASE_EMULATOR=false
```

## Firebase Console Setup (5 minutes)

1. **Enable Email/Password Provider**
   - Authentication → Sign-in method → Email/Password → Enable

2. **Enable Google Provider**
   - Authentication → Sign-in method → Google → Enable
   - Add authorized domains (localhost, production domain)

3. **Deploy Security Rules**
   - Firestore → Rules → Paste `firestore.rules` content → Publish

4. **Done!** Rest is automatic

## Common Tasks

### Check if User is Logged In

```typescript
const { currentUser } = useAuth();
if (currentUser) {
  console.log("User logged in:", currentUser.email);
}
```

### Get User Role

```typescript
const { userRole } = useAuth();
// 'agent' | 'owner' | 'admin' | null
```

### Show Loading State

```typescript
const { loading } = useAuth();
if (loading) return <Spinner />;
```

### Display Error

```typescript
const { error } = useAuth();
if (error) return <Alert>{error}</Alert>;
```

### Handle Login

```typescript
const { login, error } = useAuth();

async function handleLogin(email, password) {
  try {
    await login(email, password);
    // Redirects automatically
  } catch (err) {
    // Error is in context state
  }
}
```

### Handle Registration

```typescript
const { register } = useAuth();

async function handleRegister(email, password, name, role) {
  try {
    await register(email, password, name, role);
    // Redirects automatically
  } catch (err) {
    // Error is in context state
  }
}
```

### Sign Out

```typescript
const { logout } = useAuth();

async function handleLogout() {
  await logout();
  // Redirects to /login (implement in context)
}
```

## Error Messages

**User-Friendly Errors Handled:**

- ❌ Email already in use
- ❌ Weak password (< 6 chars)
- ❌ Invalid email format
- ❌ User not found
- ❌ Wrong password
- ❌ Network error
- ❌ Firebase unavailable

All Firebase error codes are automatically translated to plain English.

## Firestore Schema

**Users Collection: `/users/{uid}`**

```
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // User email
  displayName: string,            // User name
  photoURL: string | null,        // Profile picture (from Google or uploaded)
  role: 'agent'|'owner'|'admin',  // User role
  createdAt: Timestamp,           // Account created date
  updatedAt: Timestamp,           // Last update date
  phone?: string,                 // Optional phone number
  company?: string,               // Optional company name
  bio?: string,                   // Optional biography
  isActive: boolean               // Soft delete flag
}
```

## Security Rules Summary

**Listings:** Public read, authenticated write  
**Users:** Public read profile, own profile editable, admin-only role changes  
**Images:** Public read, authenticated upload, own-only management  
**Messages:** Private (participants only), authenticated creation

See `firestore.rules` for full details.

## Testing

### Test Registration

```
1. Go to /register
2. Enter: test@example.com, password, name, role
3. Should redirect to home
4. Check Firebase Console → Auth → should see new user
5. Check Firestore → /users/{uid} → should see profile
```

### Test Login

```
1. Go to /login
2. Enter email and password from registration
3. Should redirect to home
4. Refresh page → should stay logged in
5. Close tab, reopen → should still be logged in
```

### Test Google Sign-In

```
1. Click "Sign in with Google" on /login or /register
2. First time: creates profile with role 'owner'
3. Should redirect to home
4. Next time: just logs in existing profile
```

## Troubleshooting

**"useAuth must be used within an AuthProvider"**
→ Make sure component is inside `<AuthProvider>` in App.tsx

**Google sign-in button not working**
→ Check Google is enabled in Firebase Console
→ Verify domain is in authorized list

**Can't log in after registration**
→ Check user document exists in `/users/{uid}` Firestore collection
→ Verify email matches exactly

**Session not persisting**
→ Check browser local storage is enabled
→ Try incognito mode to rule out cache issues

**Getting permission denied errors**
→ Check Firestore security rules are deployed correctly
→ Verify user document was created during registration

## Next Steps

**Recommended Enhancements:**

1. Email verification before access
2. Password reset page
3. User profile editor
4. Admin dashboard
5. Two-factor authentication
6. Account deletion/deactivation

**For Production:**

1. Deploy to Firebase
2. Configure Google OAuth domains
3. Enable email verification
4. Set up email templates
5. Monitor auth error logs
6. Test with production Firebase project

## Documentation Links

- **Full Setup:** [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)
- **Implementation Details:** [AUTHENTICATION_SUMMARY.md](./AUTHENTICATION_SUMMARY.md)
- **Security Rules:** [firestore.rules](./firestore.rules)
- **Firebase Docs:** https://firebase.google.com/docs/auth
- **React Context:** https://react.dev/learn/passing-data-deeply-with-context

## Code Examples

**Complete Login Component**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button disabled={loading} type="submit">
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <button
        disabled={loading}
        type="button"
        onClick={loginWithGoogle}
      >
        Sign in with Google
      </button>
    </form>
  );
}
```

**Protected Route Component**

```typescript
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children, requiredRole = null }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}

// Usage in App.tsx:
// <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
```

---

**Questions?** Refer to the full guides or check Firebase documentation.
