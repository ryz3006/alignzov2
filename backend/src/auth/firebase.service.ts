import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const serviceAccountPath = this.configService.get<string>('FIREBASE_ADMIN_SDK_PATH');
    
    if (!serviceAccountPath) {
      console.warn('FIREBASE_ADMIN_SDK_PATH not configured - Firebase authentication will be disabled');
      return;
    }

    try {
      // Resolve the path relative to the project root
      const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
      console.log('Firebase service account path:', resolvedPath);
      console.log('Current working directory:', process.cwd());
      
      // Read the service account file directly
      const fs = require('fs');
      if (fs.existsSync(resolvedPath)) {
        const serviceAccountContent = fs.readFileSync(resolvedPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountContent);
        console.log('Service account loaded successfully, project ID:', serviceAccount.project_id);
        
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        });
        console.log('Firebase Admin SDK initialized successfully');
      } else {
        console.warn('Firebase service account file not found at:', resolvedPath);
        // Try alternative paths
        const alternativePaths = [
          path.resolve(__dirname, '../../configs/firebase/dalignzo-firebase-adminsdk-fbsvc-326bf38898.json'),
          path.resolve(process.cwd(), '../configs/firebase/dalignzo-firebase-adminsdk-fbsvc-326bf38898.json'),
          path.resolve(process.cwd(), '../../configs/firebase/dalignzo-firebase-adminsdk-fbsvc-326bf38898.json'),
        ];
        
        for (const altPath of alternativePaths) {
          console.log('Trying alternative path:', altPath);
          if (fs.existsSync(altPath)) {
            console.log('Found file at alternative path:', altPath);
            const serviceAccountContent = fs.readFileSync(altPath, 'utf8');
            const serviceAccount = JSON.parse(serviceAccountContent);
            console.log('Service account loaded successfully, project ID:', serviceAccount.project_id);
            
            this.firebaseApp = admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
            });
            console.log('Firebase Admin SDK initialized successfully');
            break;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to initialize Firebase Admin SDK:', error.message);
      console.warn('Error details:', error);
      console.warn('Firebase authentication will be disabled');
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const decodedToken = await this.firebaseApp.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error(`Failed to verify Firebase ID token: ${error.message}`);
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const userRecord = await this.firebaseApp.auth().getUser(uid);
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to get Firebase user: ${error.message}`);
    }
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const userRecord = await this.firebaseApp.auth().getUserByEmail(email);
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to get Firebase user by email: ${error.message}`);
    }
  }

  async createUser(userData: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const userRecord = await this.firebaseApp.auth().createUser(userData);
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to create Firebase user: ${error.message}`);
    }
  }

  async updateUser(uid: string, userData: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const userRecord = await this.firebaseApp.auth().updateUser(uid, userData);
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to update Firebase user: ${error.message}`);
    }
  }

  async deleteUser(uid: string): Promise<void> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      await this.firebaseApp.auth().deleteUser(uid);
    } catch (error) {
      throw new Error(`Failed to delete Firebase user: ${error.message}`);
    }
  }

  async setCustomUserClaims(uid: string, claims: object): Promise<void> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      await this.firebaseApp.auth().setCustomUserClaims(uid, claims);
    } catch (error) {
      throw new Error(`Failed to set custom claims: ${error.message}`);
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      await this.firebaseApp.auth().revokeRefreshTokens(uid);
    } catch (error) {
      throw new Error(`Failed to revoke refresh tokens: ${error.message}`);
    }
  }

  isInitialized(): boolean {
    return this.firebaseApp !== null;
  }
} 