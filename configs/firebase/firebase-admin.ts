// Firebase Admin SDK Configuration for Alignzo Backend
// Server-side Firebase Configuration

import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Firebase Admin configuration
let firebaseAdmin: admin.app.App;

/**
 * Initialize Firebase Admin SDK
 * Uses service account key file for authentication
 */
export const initializeFirebaseAdmin = (): admin.app.App => {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // Path to the service account key file
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || 
      path.join(process.cwd(), 'configs', 'firebase', 'dalignzo-firebase-adminsdk-fbsvc-326bf38898.json');

    // Check if service account file exists
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Firebase service account file not found at: ${serviceAccountPath}`);
    }

    // Load service account credentials
    const serviceAccount = require(serviceAccountPath) as ServiceAccount;

    // Initialize Firebase Admin
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'dalignzo',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'dalignzo.firebasestorage.app',
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseAdmin;

  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
  }
};

/**
 * Get Firebase Admin instance
 */
export const getFirebaseAdmin = (): admin.app.App => {
  if (!firebaseAdmin) {
    return initializeFirebaseAdmin();
  }
  return firebaseAdmin;
};

/**
 * Verify Firebase ID token
 * @param idToken - Firebase ID token to verify
 * @returns Decoded token with user information
 */
export const verifyIdToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    const app = getFirebaseAdmin();
    const decodedToken = await app.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Get user by email
 * @param email - User email address
 * @returns Firebase user record
 */
export const getUserByEmail = async (email: string): Promise<admin.auth.UserRecord> => {
  try {
    const app = getFirebaseAdmin();
    const userRecord = await app.auth().getUserByEmail(email);
    return userRecord;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error(`User not found with email: ${email}`);
  }
};

/**
 * Get user by UID
 * @param uid - Firebase user UID
 * @returns Firebase user record
 */
export const getUserByUid = async (uid: string): Promise<admin.auth.UserRecord> => {
  try {
    const app = getFirebaseAdmin();
    const userRecord = await app.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    throw new Error(`User not found with UID: ${uid}`);
  }
};

/**
 * Create custom token for user
 * @param uid - Firebase user UID
 * @param additionalClaims - Additional claims to include in token
 * @returns Custom token string
 */
export const createCustomToken = async (
  uid: string, 
  additionalClaims?: object
): Promise<string> => {
  try {
    const app = getFirebaseAdmin();
    const customToken = await app.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw new Error('Failed to create custom token');
  }
};

/**
 * Set custom user claims
 * @param uid - Firebase user UID
 * @param customClaims - Custom claims to set
 */
export const setCustomUserClaims = async (
  uid: string, 
  customClaims: object
): Promise<void> => {
  try {
    const app = getFirebaseAdmin();
    await app.auth().setCustomUserClaims(uid, customClaims);
  } catch (error) {
    console.error('Error setting custom user claims:', error);
    throw new Error('Failed to set custom user claims');
  }
};

/**
 * Revoke refresh tokens for user
 * @param uid - Firebase user UID
 */
export const revokeRefreshTokens = async (uid: string): Promise<void> => {
  try {
    const app = getFirebaseAdmin();
    await app.auth().revokeRefreshTokens(uid);
  } catch (error) {
    console.error('Error revoking refresh tokens:', error);
    throw new Error('Failed to revoke refresh tokens');
  }
};

/**
 * Delete user account
 * @param uid - Firebase user UID
 */
export const deleteUser = async (uid: string): Promise<void> => {
  try {
    const app = getFirebaseAdmin();
    await app.auth().deleteUser(uid);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

/**
 * Validate email domain against allowed domains
 * @param email - User email address
 * @returns True if domain is allowed, false otherwise
 */
export const validateEmailDomain = (email: string): boolean => {
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];
  
  if (allowedDomains.length === 0) {
    return true; // No domain restriction
  }
  
  const emailDomain = email.split('@')[1];
  return allowedDomains.includes(emailDomain);
};

/**
 * Batch get users
 * @param uids - Array of Firebase user UIDs
 * @returns Array of user records
 */
export const getUsers = async (uids: string[]): Promise<admin.auth.UserRecord[]> => {
  try {
    const app = getFirebaseAdmin();
    const getUsersResult = await app.auth().getUsers(
      uids.map(uid => ({ uid }))
    );
    return getUsersResult.users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw new Error('Failed to get users');
  }
};

// Export Firebase Admin modules for direct use
export { admin };
export default firebaseAdmin;