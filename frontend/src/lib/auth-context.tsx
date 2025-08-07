'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { auth, signInWithGoogle, signOut as firebaseSignOut } from '@/configs/firebase/firebase-config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { buildApiUrl } from '@/configs/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  projectMembers?: Array<{
    id: string;
    projectId: string;
    role: string;
    reportingToId?: string;
    project: {
      id: string;
      name: string;
      code: string;
    };
    reportingTo?: {
      id: string;
      firstName: string;
      lastName: string;
      displayName?: string;
    };
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  apiCall: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check if user is authenticated on mount
  useEffect(() => {
    let isInitialLoad = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Firebase auth state changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        try {
          // Get the ID token
          const idToken = await firebaseUser.getIdToken();
          console.log('Got Firebase ID token for user:', firebaseUser.email);
          
          // Send the token to our backend to verify and get user data
          const response = await fetch(buildApiUrl('/api/auth/login/google'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ idToken }),
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('Backend authentication successful:', userData);
            setUser(userData.user);
            setToken(userData.token);
            
            // Store in localStorage for persistence
            localStorage.setItem('jwt_token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData.user));
            
            // Only redirect on initial load, not on subsequent auth state changes
            if (isInitialLoad) {
              console.log('Redirecting to dashboard on initial load');
              router.push('/dashboard');
            }
          } else {
            const errorData = await response.text();
            console.error('Failed to authenticate with backend:', response.status, errorData);
            
            // Handle specific error cases
            if (response.status === 401) {
              try {
                const error = JSON.parse(errorData);
                if (error.message?.includes('organization is not registered')) {
                  // Redirect to unauthorized page for unregistered organizations
                  router.push('/unauthorized');
                } else if (error.message?.includes('requires additional setup')) {
                  // Redirect to not onboarded page for users without proper setup
                  router.push('/not-onboarded');
                } else {
                  // Generic unauthorized - redirect to login
                  router.push('/login');
                }
              } catch (parseError) {
                // If error parsing fails, redirect to login
                router.push('/login');
              }
            } else {
              // For other errors, redirect to login
              router.push('/login');
            }
            
            setUser(null);
            setToken(null);
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          setUser(null);
          setToken(null);
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user');
        }
      } else {
        // This block runs on logout
        setUser(null);
        setToken(null);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        queryClient.clear(); // Clear all query data
        router.push('/login'); // Redirect to login on logout
      }
      
      isInitialLoad = false;
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, queryClient]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      console.log('Firebase sign-in successful:', result.user.email);
      // The onAuthStateChanged listener will handle the backend authentication
    } catch (error) {
      console.error('Google login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Calling firebaseSignOut will trigger the onAuthStateChanged listener,
      // which will handle all the cleanup and redirection logic.
      await firebaseSignOut();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const refreshToken = async () => {
    try {
      console.log('AuthContext: Attempting to refresh token...');
      
      // Use the existing JWT token for refresh, not Firebase ID token
      const currentToken = localStorage.getItem('jwt_token');
      if (!currentToken) {
        console.log('AuthContext: No JWT token found for refresh');
        throw new Error('No token available for refresh');
      }
      
      const response = await fetch(buildApiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('AuthContext: Token refresh successful:', userData.user);
        setUser(userData.user);
        setToken(userData.token);
        localStorage.setItem('jwt_token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData.user));
      } else {
        const errorText = await response.text();
        console.error('AuthContext: Token refresh failed:', response.status, errorText);
        // Token refresh failed, clear everything
        setUser(null);
        setToken(null);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('AuthContext: Token refresh failed:', error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  // Utility function to make authenticated API calls
  const apiCall = async (url: string, options: RequestInit = {}) => {
    // Build the full API URL with the correct base URL
    const fullUrl = buildApiUrl(url);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Try to refresh token if we have a user but no token
      if (user) {
        await refreshToken();
        // If we still don't have a token after refresh, redirect to login
        if (!token) {
          router.push('/login');
          throw new Error('Authentication required');
        }
      } else {
        router.push('/login');
        throw new Error('Authentication required');
      }
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });

    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      await refreshToken();
      
      // Retry the request with the new token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        return fetch(fullUrl, {
          ...options,
          headers,
          credentials: 'include',
        });
      } else {
        router.push('/login');
        throw new Error('Authentication required');
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithGoogle,
        logout,
        refreshToken,
        apiCall,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  

  
  return context;
} 