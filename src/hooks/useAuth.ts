/**
 * useAuth Hook
 *
 * Custom hook to access Auth Context
 * Provides type-safe access to authentication state and methods
 *
 * Usage:
 * ```typescript
 * const { currentUser, login, logout, loading } = useAuth();
 * ```
 */

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "../context/AuthContext";

/**
 * Hook to access Auth Context
 *
 * @returns AuthContextValue - Auth state and methods
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { currentUser, login, logout, loading, error } = useAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   if (currentUser) {
 *     return (
 *       <div>
 *         <p>Welcome, {currentUser.email}</p>
 *         <button onClick={logout}>Logout</button>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <button onClick={() => login('user@example.com', 'password')}>
 *       Login
 *     </button>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
        "Make sure your component is wrapped with <AuthProvider> at the root of your app.",
    );
  }

  return context;
}
