/**
 * Users Service - Firestore User Management
 *
 * Manages user profiles and metadata in Firestore:
 * - Create user documents
 * - Fetch user data
 * - Update user role
 * - Delete user data
 *
 * Firestore Collection: /users/{uid}
 */

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

/**
 * User role type
 * Same as in domain models for consistency
 */
export type UserRole = "agent" | "owner" | "admin";

/**
 * Firestore user document structure
 */
export interface FirestoreUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  phone?: string;
  company?: string;
  bio?: string;
  isActive: boolean;
}

/**
 * Domain user type (no Firestore-specific types)
 */
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  phone?: string;
  company?: string;
  bio?: string;
  isActive: boolean;
}

/**
 * Error type for user service
 */
export interface UserServiceError {
  code: string;
  message: string;
}

/**
 * Users service for Firestore operations
 */
export class UsersService {
  private db = getFirestore();
  private USERS_COLLECTION = "users";

  /**
   * Create a new user document in Firestore
   *
   * Called after successful Firebase Auth registration
   *
   * @param uid User ID from Firebase Auth
   * @param email User email
   * @param displayName User display name (optional)
   * @param role User role (agent or owner)
   * @returns Promise<User> - Created user
   * @throws UserServiceError on failure
   */
  async createUser(
    uid: string,
    email: string,
    displayName: string | null = null,
    role: UserRole = "owner",
  ): Promise<User> {
    try {
      const now = Timestamp.now();

      const firestoreUser: FirestoreUser = {
        uid,
        email,
        displayName,
        photoURL: null,
        role,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };

      await setDoc(doc(this.db, this.USERS_COLLECTION, uid), firestoreUser);

      return this.mapFirestoreToUser(firestoreUser);
    } catch (error) {
      throw this.handleError(error, "Failed to create user");
    }
  }

  /**
   * Fetch user document from Firestore
   *
   * @param uid User ID
   * @returns Promise<User | null> - User if exists, null otherwise
   * @throws UserServiceError on failure
   */
  async getUser(uid: string): Promise<User | null> {
    try {
      const docSnapshot = await getDoc(
        doc(this.db, this.USERS_COLLECTION, uid),
      );

      if (!docSnapshot.exists()) {
        return null;
      }

      return this.mapFirestoreToUser(docSnapshot.data() as FirestoreUser);
    } catch (error) {
      throw this.handleError(error, "Failed to fetch user");
    }
  }

  /**
   * Update user profile information
   *
   * @param uid User ID
   * @param updates Partial user data to update
   * @returns Promise<User> - Updated user
   * @throws UserServiceError on failure
   */
  async updateUser(uid: string, updates: Partial<User>): Promise<User> {
    try {
      // Fetch existing user
      const existing = await this.getUser(uid);
      if (!existing) {
        throw this.createError("USER_NOT_FOUND", "User not found");
      }

      // Build update payload (exclude system fields)
      const updatePayload: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Don't allow changing uid, email, createdAt
      delete updatePayload.uid;
      delete updatePayload.email;
      delete updatePayload.createdAt;

      // Update Firestore document
      await updateDoc(doc(this.db, this.USERS_COLLECTION, uid), updatePayload);

      // Return updated user
      return this.getUser(uid) as Promise<User>;
    } catch (error) {
      if (this.isUserServiceError(error)) throw error;
      throw this.handleError(error, "Failed to update user");
    }
  }

  /**
   * Update user role
   *
   * @param uid User ID
   * @param role New role (agent or owner)
   * @returns Promise<User> - Updated user
   * @throws UserServiceError on failure
   */
  async updateUserRole(uid: string, role: UserRole): Promise<User> {
    return this.updateUser(uid, { role });
  }

  /**
   * Delete user document from Firestore
   *
   * Note: This does NOT delete the Firebase Auth account
   * Call Firebase Auth signOut() separately to delete auth account
   *
   * @param uid User ID
   * @throws UserServiceError on failure
   */
  async deleteUserData(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, this.USERS_COLLECTION, uid));
    } catch (error) {
      throw this.handleError(error, "Failed to delete user data");
    }
  }

  /**
   * Deactivate user account
   *
   * Instead of hard delete, mark as inactive
   * Preserves history and allows reactivation
   *
   * @param uid User ID
   * @returns Promise<User> - Updated user
   * @throws UserServiceError on failure
   */
  async deactivateUser(uid: string): Promise<User> {
    return this.updateUser(uid, { isActive: false });
  }

  /**
   * Reactivate user account
   *
   * @param uid User ID
   * @returns Promise<User> - Updated user
   * @throws UserServiceError on failure
   */
  async reactivateUser(uid: string): Promise<User> {
    return this.updateUser(uid, { isActive: true });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Map Firestore user to domain user
   */
  private mapFirestoreToUser(firestoreUser: FirestoreUser): User {
    return {
      uid: firestoreUser.uid,
      email: firestoreUser.email,
      displayName: firestoreUser.displayName,
      photoURL: firestoreUser.photoURL,
      role: firestoreUser.role,
      createdAt: firestoreUser.createdAt.toDate().toISOString(),
      updatedAt: firestoreUser.updatedAt.toDate().toISOString(),
      phone: firestoreUser.phone,
      company: firestoreUser.company,
      bio: firestoreUser.bio,
      isActive: firestoreUser.isActive,
    };
  }

  /**
   * Create standardized error
   */
  private createError(code: string, message: string): UserServiceError {
    return { code, message };
  }

  /**
   * Handle errors with standardized format
   */
  private handleError(error: any, fallbackMessage: string): UserServiceError {
    if (error instanceof Error) {
      return this.createError("SERVICE_ERROR", error.message);
    }
    return this.createError("SERVICE_ERROR", fallbackMessage);
  }

  /**
   * Type guard for UserServiceError
   */
  private isUserServiceError(error: any): error is UserServiceError {
    return error && typeof error === "object" && "code" in error;
  }
}
