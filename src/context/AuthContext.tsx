/**
 * Auth Context - React Context for Authentication State
 *
 * Provides:
 * - currentUser: Authenticated user or null
 * - userRole: User's role (agent, owner, admin)
 * - login: Login with email/password
 * - loginWithGoogle: Sign in with Google
 * - register: Register new user
 * - logout: Sign out
 * - loading: Authentication state loading
 *
 * Architecture:
 * - Wraps Firebase Auth and Firestore Users service
 * - Handles session persistence
 * - Manages authentication state
 * - Provides clean API to UI components
 */

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  FirebaseAuthService,
  type AuthUser,
} from "../services/auth/authService";
import {
  UsersService,
  type User,
  type UserRole,
} from "../services/auth/usersService";

/**
 * Auth context value type
 */
export interface AuthContextValue {
  // State
  currentUser: AuthUser | null;
  userRole: UserRole | null;
  user: User | null; // Full user profile from Firestore
  loading: boolean;
  error: string | null;

  // Methods
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Auth Context
 * Default value will be overridden by provider
 */
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 *
 * Wraps application with authentication context
 * Handles Firebase Auth state and Firestore user data
 *
 * Usage:
 * ```typescript
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Services
  const authService = new FirebaseAuthService();
  const usersService = new UsersService();

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch user profile from Firestore
   */
  const fetchUserProfile = useCallback(
    async (uid: string) => {
      try {
        const profile = await usersService.getUser(uid);
        if (profile) {
          setUser(profile);
          setUserRole(profile.role);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        // Don't fail auth if profile fetch fails
        setUser(null);
        setUserRole(null);
      }
    },
    [usersService],
  );

  /**
   * Handle auth state changes
   * This runs on app startup to check for existing session
   */
  useEffect(() => {
    setLoading(true);
    clearError();

    const unsubscribe = authService.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setCurrentUser(authUser);
        // Fetch full user profile from Firestore
        await fetchUserProfile(authUser.uid);
      } else {
        setCurrentUser(null);
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, [authService, fetchUserProfile, clearError]);

  /**
   * Register new user
   *
   * Process:
   * 1. Register in Firebase Auth
   * 2. Create user document in Firestore
   * 3. Update context state
   */
  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: UserRole,
    ) => {
      try {
        setLoading(true);
        clearError();

        // Register in Firebase Auth
        const authUser = await authService.registerWithEmail(email, password);

        // Create user document in Firestore
        const userProfile = await usersService.createUser(
          authUser.uid,
          email,
          displayName || null,
          role,
        );

        // Update context state
        setCurrentUser(authUser);
        setUser(userProfile);
        setUserRole(userProfile.role);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        setError(message);
        setCurrentUser(null);
        setUser(null);
        setUserRole(null);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authService, usersService, clearError],
  );

  /**
   * Login with email and password
   *
   * Process:
   * 1. Login in Firebase Auth
   * 2. Fetch user profile from Firestore
   * 3. Update context state
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        clearError();

        // Login in Firebase Auth
        const authUser = await authService.loginWithEmail(email, password);

        // Fetch user profile from Firestore
        const userProfile = await usersService.getUser(authUser.uid);

        // Update context state
        setCurrentUser(authUser);
        setUser(userProfile);
        setUserRole(userProfile?.role || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        setCurrentUser(null);
        setUser(null);
        setUserRole(null);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authService, usersService, clearError],
  );

  /**
   * Login with Google
   *
   * Process:
   * 1. Sign in with Google popup
   * 2. Check if user exists in Firestore
   * 3. If new user, create profile with owner role
   * 4. If existing user, fetch profile
   * 5. Update context state
   */
  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      // Sign in with Google
      const authUser = await authService.loginWithGoogle();

      // Check if user exists in Firestore
      let userProfile = await usersService.getUser(authUser.uid);

      // If new user, create profile
      if (!userProfile) {
        userProfile = await usersService.createUser(
          authUser.uid,
          authUser.email || "",
          authUser.displayName || null,
          "owner", // Default role for Google sign-in
        );
      }

      // Update context state
      setCurrentUser(authUser);
      setUser(userProfile);
      setUserRole(userProfile.role);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed";
      setError(message);
      setCurrentUser(null);
      setUser(null);
      setUserRole(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authService, usersService, clearError]);

  /**
   * Logout
   *
   * Process:
   * 1. Sign out from Firebase Auth
   * 2. Clear context state
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setCurrentUser(null);
      setUser(null);
      setUserRole(null);
      clearError();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authService, clearError]);

  /**
   * Send password reset email
   */
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        clearError();
        await authService.sendPasswordReset(email);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Password reset failed";
        setError(message);
        throw err;
      }
    },
    [authService, clearError],
  );

  /**
   * Context value
   */
  const value: AuthContextValue = {
    currentUser,
    userRole,
    user,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
