# Firebase Configuration for Alignzo

## Overview

This directory contains Firebase configuration files for both frontend and backend authentication in the Alignzo platform.

## Files

- `firebase-config.ts` - Frontend Firebase configuration for React/Next.js
- `firebase-admin.ts` - Backend Firebase Admin SDK configuration for NestJS
- `dalignzo-firebase-adminsdk-fbsvc-326bf38898.json` - Firebase service account key file (should be placed here)

## Firebase Service Account Setup

### Step 1: Service Account File
The Firebase service account file `dalignzo-firebase-adminsdk-fbsvc-326bf38898.json` should be placed in this directory. This file contains:

```json
{
  "type": "service_account",
  "project_id": "dalignzo",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

**Important Security Notes:**
- Never commit this file to version control
- Ensure it's added to `.gitignore`
- Keep this file secure and access-controlled
- Rotate the service account key regularly

### Step 2: Environment Variables
The following environment variables are configured in your `.env` file:

#### Frontend Environment Variables (Next.js)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dalignzo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dalignzo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dalignzo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=901156603087
NEXT_PUBLIC_FIREBASE_APP_ID=1:901156603087:web:c95c9f4f714f8f0be263ba
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-36S66F65D6
```

#### Backend Environment Variables (NestJS)
```bash
FIREBASE_API_KEY=AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk
FIREBASE_AUTH_DOMAIN=dalignzo.firebaseapp.com
FIREBASE_PROJECT_ID=dalignzo
FIREBASE_STORAGE_BUCKET=dalignzo.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=901156603087
FIREBASE_APP_ID=1:901156603087:web:c95c9f4f714f8f0be263ba
FIREBASE_MEASUREMENT_ID=G-36S66F65D6
FIREBASE_ADMIN_SDK_PATH=./configs/firebase/dalignzo-firebase-adminsdk-fbsvc-326bf38898.json
GOOGLE_APPLICATION_CREDENTIALS=./configs/firebase/dalignzo-firebase-adminsdk-fbsvc-326bf38898.json
```

## Google OAuth Configuration

### Domain Restrictions
To restrict access to specific email domains, configure:

```bash
NEXT_PUBLIC_ALLOWED_DOMAINS=yourcompany.com,partnerdomain.com
ALLOWED_EMAIL_DOMAINS=yourcompany.com,partnerdomain.com
```

### OAuth Consent Screen
Ensure your Firebase project has the OAuth consent screen configured:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project `dalignzo`
3. Navigate to Authentication > Sign-in method
4. Enable Google sign-in provider
5. Configure authorized domains (add your production domains)

## Usage Examples

### Frontend (React/Next.js)
```typescript
import { signInWithGoogle, signOut, auth } from '@/configs/firebase/firebase-config';
import { useAuthState } from 'react-firebase-hooks/auth';

// In your component
const [user, loading, error] = useAuthState(auth);

const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithGoogle();
    console.log('User signed in:', result.user);
  } catch (error) {
    console.error('Sign-in error:', error);
  }
};

const handleSignOut = async () => {
  try {
    await signOut();
    console.log('User signed out');
  } catch (error) {
    console.error('Sign-out error:', error);
  }
};
```

### Backend (NestJS)
```typescript
import { verifyIdToken, getUserByEmail } from '@/configs/firebase/firebase-admin';

// In your authentication guard/service
const verifyToken = async (idToken: string) => {
  try {
    const decodedToken = await verifyIdToken(idToken);
    const user = await getUserByEmail(decodedToken.email);
    return user;
  } catch (error) {
    throw new UnauthorizedException('Invalid token');
  }
};
```

## Security Best Practices

### 1. Environment Security
- Use different Firebase projects for development, staging, and production
- Never expose service account keys in client-side code
- Rotate service account keys regularly
- Use Firebase security rules to restrict data access

### 2. Authentication Flow
- Always verify tokens on the backend
- Implement proper session management
- Use custom claims for role-based access control
- Implement proper logout and token revocation

### 3. Domain Restrictions
- Configure authorized domains in Firebase Console
- Implement email domain validation in your application
- Use Firebase security rules to restrict access by domain

### 4. Error Handling
- Implement proper error handling for authentication failures
- Log authentication events for security monitoring
- Provide user-friendly error messages
- Implement rate limiting for authentication attempts

## Testing

### Development Testing
```bash
# Test Firebase connection
npm run test:firebase

# Test authentication flow
npm run test:auth
```

### Production Checklist
- [ ] Service account key is secure and not in version control
- [ ] Environment variables are properly configured
- [ ] Domain restrictions are enabled
- [ ] OAuth consent screen is configured
- [ ] Security rules are implemented
- [ ] Error handling is implemented
- [ ] Logging and monitoring are configured

## Troubleshooting

### Common Issues

1. **Service Account File Not Found**
   - Ensure the file exists in `configs/firebase/`
   - Check the file path in environment variables
   - Verify file permissions

2. **Authentication Failures**
   - Check Firebase project configuration
   - Verify API keys are correct
   - Ensure domains are authorized in Firebase Console

3. **Domain Restriction Issues**
   - Verify email domain configuration
   - Check OAuth consent screen settings
   - Ensure domain validation logic is correct

4. **Token Verification Failures**
   - Check service account permissions
   - Verify token expiration
   - Ensure proper token format

## Support

For Firebase-related issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Support](https://firebase.google.com/support)

For Alignzo-specific issues:
- Check the main project documentation
- Review authentication service logs
- Contact the development team