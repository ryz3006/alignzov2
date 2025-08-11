import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      try {
        const serviceAccount: admin.ServiceAccount = {
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        };

        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId,
        });
      } catch (error) {
        // Firebase authentication will be disabled
      }
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

  async createUser(
    userData: admin.auth.CreateRequest,
  ): Promise<admin.auth.UserRecord> {
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

  async updateUser(
    uid: string,
    userData: admin.auth.UpdateRequest,
  ): Promise<admin.auth.UserRecord> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const userRecord = await this.firebaseApp
        .auth()
        .updateUser(uid, userData);
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
