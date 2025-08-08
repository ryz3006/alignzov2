// Utility to clear localStorage tokens
export function clearAuthTokens() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
  console.log('Auth tokens cleared from localStorage');
  
  // Also clear any other auth-related data
  sessionStorage.clear();
  
  // Force page reload to clear any cached state
  window.location.reload();
}

// Call this function in browser console to clear tokens
if (typeof window !== 'undefined') {
  (window as any).clearAuthTokens = clearAuthTokens;
  console.log('clearAuthTokens function available. Run clearAuthTokens() in console to clear tokens and reload.');
} 