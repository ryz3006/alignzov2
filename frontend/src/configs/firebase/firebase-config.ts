// Firebase Configuration for Alignzo
// Frontend Firebase Configuration

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Prefer standardized config.json
let standardConfig: any = undefined;
try {
  // server-side only in Next; client falls back to envs
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(process.cwd(), 'config', 'config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    standardConfig = JSON.parse(raw);
  }
} catch {}

// Firebase configuration object
const firebaseConfig = {
  apiKey: standardConfig?.firebase?.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: standardConfig?.firebase?.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: standardConfig?.firebase?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: standardConfig?.firebase?.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth: Auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db: Firestore = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage: FirebaseStorage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Set custom parameters for Google Auth
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || undefined // Domain restriction if needed
});

// Auth helper functions
export const signInWithGoogle = async () => {
  try {
    const { signInWithPopup } = await import('firebase/auth');
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Check if user email domain is allowed
export const isEmailDomainAllowed = (email: string): boolean => {
  const allowedDomains = process.env.NEXT_PUBLIC_ALLOWED_DOMAINS?.split(',') || [];
  
  if (allowedDomains.length === 0) {
    return true; // No domain restriction
  }
  
  const emailDomain = email.split('@')[1];
  return allowedDomains.includes(emailDomain);
};

// Export the Firebase app
export default app; 