/**
 * Firebase Authentication Service
 *
 * Handles all authentication operations:
 * - Email/password registration and login
 * - Google sign-in
 * - Password reset
 * - Logout
 * - Session persistence
 *
 * Architecture:
 * - Encapsulates Firebase Auth SDK
 * - Provides clean, promise-based API
 * - Standardized error handling
 * - No Firebase types exposed to UI
 */

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type AuthError,
  type User,
} from "firebase/auth";

/**
 * Domain type for auth errors (backend-agnostic)
 */
export interface AuthServiceError {
  code: string;
  message: string;
  userFriendlyMessage: string;
}

/**
 * Domain type for authenticated user (backend-agnostic)
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

/**
 * Auth service for Firebase operations
 */
export class FirebaseAuthService {
  private auth = getAuth();
  private googleProvider = new GoogleAuthProvider();

  constructor() {
    // Enable session persistence by default
    this.enablePersistence();
  }

  /**
   * Enable session persistence (keep user logged in after page reload)
   */
  private async enablePersistence(): Promise<void> {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
    } catch (error) {
      console.error("[AuthService] Failed to enable persistence:", error);
    }
  }

  /**
   * Get current authenticated user
   * Returns null if no user is logged in
   */
  getCurrentUser(): AuthUser | null {
    const user = this.auth.currentUser;
    if (!user) return null;

    return this.mapFirebaseUserToAuthUser(user);
  }

  /**
   * Register new user with email and password
   *
   * Process:
   * 1. Create user account in Firebase Auth
   * 2. Return auth user (caller will create Firestore user doc)
   *
   * @param email User email
   * @param password User password (min 6 characters)
   * @returns Promise<AuthUser> - Created user
   * @throws AuthServiceError on failure
   */
  async registerWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      // Validate input
      if (!email || !password) {
        throw this.createError(
          "INVALID_INPUT",
          "Email and password are required",
        );
      }

      if (password.length < 6) {
        throw this.createError(
          "WEAK_PASSWORD",
          "Password must be at least 6 characters",
        );
      }

      // Create user in Firebase Auth
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

      return this.mapFirebaseUserToAuthUser(credential.user);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login user with email and password
   *
   * @param email User email
   * @param password User password
   * @returns Promise<AuthUser> - Authenticated user
   * @throws AuthServiceError on failure
   */
  async loginWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      // Validate input
      if (!email || !password) {
        throw this.createError(
          "INVALID_INPUT",
          "Email and password are required",
        );
      }

      // Sign in with Firebase Auth
      const credential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

      return this.mapFirebaseUserToAuthUser(credential.user);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Google using popup
   *
   * @returns Promise<AuthUser> - Authenticated user
   * @throws AuthServiceError on failure
   */
  async loginWithGoogle(): Promise<AuthUser> {
    try {
      // Configure Google provider
      this.googleProvider.addScope("profile");
      this.googleProvider.addScope("email");

      // Sign in with popup
      const credential = await signInWithPopup(this.auth, this.googleProvider);

      return this.mapFirebaseUserToAuthUser(credential.user);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   *
   * @param email User email
   * @throws AuthServiceError on failure
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      if (!email) {
        throw this.createError("INVALID_INPUT", "Email is required");
      }

      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout current user
   *
   * @throws AuthServiceError on failure
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Listen to auth state changes
   * Calls callback whenever authentication state changes
   *
   * @param callback Function called with current user or null
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = authService.onAuthStateChanged((user) => {
   *   if (user) {
   *     console.log('User logged in:', user.uid);
   *   } else {
   *     console.log('User logged out');
   *   }
   * });
   *
   * // Cleanup when done
   * unsubscribe();
   * ```
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        callback(this.mapFirebaseUserToAuthUser(firebaseUser));
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Map Firebase User to domain AuthUser
   */
  private mapFirebaseUserToAuthUser(firebaseUser: User): AuthUser {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
    };
  }

  /**
   * Create standardized auth error
   */
  private createError(code: string, message: string): AuthServiceError {
    return {
      code,
      message,
      userFriendlyMessage: this.getUserFriendlyMessage(code, message),
    };
  }

  /**
   * Convert Firebase Auth errors to domain errors with user-friendly messages
   */
  private handleAuthError(error: any): AuthServiceError {
    const firebaseError = error as AuthError;

    // Map Firebase error codes to user-friendly messages
    const errorCodeMap: Record<string, { code: string; message: string }> = {
      "auth/email-already-in-use": {
        code: "EMAIL_ALREADY_REGISTERED",
        message: "This email is already registered. Please login instead.",
      },
      "auth/invalid-email": {
        code: "INVALID_EMAIL",
        message: "Please enter a valid email address.",
      },
      "auth/weak-password": {
        code: "WEAK_PASSWORD",
        message: "Password must be at least 6 characters.",
      },
      "auth/user-not-found": {
        code: "USER_NOT_FOUND",
        message: "No account found with this email. Please register first.",
      },
      "auth/wrong-password": {
        code: "WRONG_PASSWORD",
        message: "Incorrect password. Please try again.",
      },
      "auth/too-many-requests": {
        code: "TOO_MANY_REQUESTS",
        message:
          "Too many failed login attempts. Please try again in a few minutes.",
      },
      "auth/popup-closed-by-user": {
        code: "POPUP_CLOSED",
        message: "Sign-in popup was closed. Please try again.",
      },
      "auth/network-request-failed": {
        code: "NETWORK_ERROR",
        message: "Network error. Please check your connection and try again.",
      },
    };

    const mapped = errorCodeMap[firebaseError.code];
    if (mapped) {
      return {
        code: mapped.code,
        message: firebaseError.message,
        userFriendlyMessage: mapped.message,
      };
    }

    // Fallback for unmapped errors
    return {
      code: "UNKNOWN_ERROR",
      message: firebaseError.message || "An unknown error occurred",
      userFriendlyMessage:
        "An error occurred. Please try again or contact support.",
    };
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(code: string, fallback: string): string {
    const messages: Record<string, string> = {
      INVALID_INPUT: "Please fill in all required fields.",
      WEAK_PASSWORD: "Password must be at least 6 characters.",
      EMAIL_ALREADY_REGISTERED:
        "This email is already registered. Please login instead.",
      INVALID_EMAIL: "Please enter a valid email address.",
      USER_NOT_FOUND:
        "No account found with this email. Please register first.",
      WRONG_PASSWORD: "Incorrect password. Please try again.",
      TOO_MANY_REQUESTS:
        "Too many failed attempts. Please try again in a few minutes.",
      POPUP_CLOSED: "Sign-in popup was closed. Please try again.",
      NETWORK_ERROR: "Network error. Please check your connection.",
    };

    return messages[code] || fallback;
  }
}
