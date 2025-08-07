import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Always call super() first
    super({
      clientID: clientID || 'mock-client-id',
      clientSecret: clientSecret || 'mock-client-secret',
      callbackURL: callbackURL || `${process.env.API_URL || 'http://localhost:3001'}/api/auth/login/google/callback`,
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });

    // Check if Google OAuth credentials are properly configured
    this.isConfigured = !!(clientID && clientID !== 'your_google_client_id_here' && 
                           clientSecret && clientSecret !== 'your_google_client_secret_here');

    if (!this.isConfigured) {
      console.warn('⚠️  Google OAuth credentials not configured. Google authentication will be disabled.');
      console.warn('   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.');
      console.warn('   For development, you can use mock credentials or set up a Google OAuth application.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      // If not configured, reject the authentication
      if (!this.isConfigured) {
        return done(new Error('Google OAuth is not configured'), false);
      }

      const { name, emails, photos } = profile;
      
      const user = {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        avatarUrl: photos[0].value,
        accessToken,
      };

      done(null, user);
    } catch (error) {
      console.error('Google OAuth validation error:', error);
      done(error, false);
    }
  }
} 