// Firebase Configuration for Alignzo
// Frontend Firebase Configuration

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dalignzo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dalignzo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dalignzo.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '901156603087',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:901156603087:web:c95c9f4f714f8f0be263ba',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-36S66F65D6'
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