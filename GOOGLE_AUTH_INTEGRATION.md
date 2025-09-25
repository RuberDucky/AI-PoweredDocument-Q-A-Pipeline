# Google Authentication Integration Guide

## Overview

This guide shows you how to integrate Google authentication with Firebase in your React Vite TypeScript application. The backend supports both traditional Google OAuth and Firebase Authentication methods.

## Table of Contents

1. [Backend API Endpoints](#backend-api-endpoints)
2. [Frontend Setup](#frontend-setup)
3. [Firebase Configuration](#firebase-configuration)
4. [React Components](#react-components)
5. [TypeScript Types](#typescript-types)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

---

## Backend API Endpoints

### 1. **Traditional Google OAuth** (Passport-based)

#### Get Google Auth URL
```http
GET /api/v1/auth/google/url
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "http://localhost:3001/api/v1/auth/google",
    "message": "Open this URL in a popup window for Google OAuth"
  }
}
```

#### Google OAuth Login
```http
GET /api/v1/auth/google
```
*Opens Google OAuth consent screen*

#### Google OAuth Callback
```http
GET /api/v1/auth/google/callback
```
*Returns HTML with postMessage to parent window*

### 2. **Firebase Authentication** (Recommended)

#### Verify Firebase ID Token
```http
POST /api/v1/auth/firebase/verify
Content-Type: application/json
```

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-v4",
      "fullName": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://...",
      "authProvider": "firebase",
      "isActive": true,
      "createdAt": "2025-09-25T...",
      "updatedAt": "2025-09-25T..."
    }
  }
}
```

### 3. **Existing Endpoints**

All existing authentication endpoints remain unchanged:

- `POST /api/v1/auth/signup` - Traditional signup
- `POST /api/v1/auth/login` - Traditional login
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/logout` - Logout

---

## Frontend Setup

### 1. Install Dependencies

```bash
npm install firebase
npm install @types/google.accounts
```

### 2. Environment Variables

Create/update your `.env` file:

```env
# Your Firebase config
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=documind-778a7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=documind-778a7
VITE_FIREBASE_STORAGE_BUCKET=documind-778a7.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google OAuth Client ID (for Google One Tap)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Backend API URL
VITE_API_BASE_URL=http://localhost:3001
```

---

## Firebase Configuration

### 1. Firebase Config (`src/config/firebase.ts`)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export default app;
```

---

## React Components

### 1. Authentication Service (`src/services/authService.ts`)

```typescript
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface User {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  authProvider: 'local' | 'google' | 'firebase';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('authToken');
    
    // Listen for Firebase auth state changes
    onAuthStateChanged(auth, this.handleFirebaseAuthChange.bind(this));
  }

  // Firebase Google Sign-In with Popup
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      return await this.verifyFirebaseToken(idToken);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  // Firebase Google Sign-In with Redirect (for mobile)
  async signInWithGoogleRedirect(): Promise<void> {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error('Google redirect sign-in error:', error);
      throw new Error(error.message || 'Failed to initiate Google sign-in');
    }
  }

  // Handle redirect result
  async handleRedirectResult(): Promise<AuthResponse | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        const idToken = await result.user.getIdToken();
        return await this.verifyFirebaseToken(idToken);
      }
      return null;
    } catch (error: any) {
      console.error('Redirect result error:', error);
      throw new Error(error.message || 'Failed to handle redirect result');
    }
  }

  // Verify Firebase ID Token with backend
  private async verifyFirebaseToken(idToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/v1/auth/firebase/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();
    
    if (data.success && data.data?.token) {
      this.setToken(data.data.token);
    }
    
    return data;
  }

  // Traditional email/password login
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (data.success && data.data?.token) {
      this.setToken(data.data.token);
    }
    
    return data;
  }

  // Traditional signup
  async signup(fullName: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullName, email, password }),
    });

    const data = await response.json();
    
    if (data.success && data.data?.token) {
      this.setToken(data.data.token);
    }
    
    return data;
  }

  // Get user profile
  async getProfile(): Promise<User | null> {
    if (!this.token) return null;

    const response = await fetch(`${API_BASE}/api/v1/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    const data = await response.json();
    return data.success ? data.data.user : null;
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear local token
      this.clearToken();
      
      // Notify backend (optional)
      if (this.token) {
        await fetch(`${API_BASE}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear token anyway
      this.clearToken();
    }
  }

  // Handle Firebase auth state changes
  private async handleFirebaseAuthChange(user: FirebaseUser | null): void {
    if (user && !this.token) {
      // User signed in but we don't have a backend token yet
      try {
        const idToken = await user.getIdToken();
        await this.verifyFirebaseToken(idToken);
      } catch (error) {
        console.error('Auto token verification failed:', error);
      }
    }
  }

  // Token management
  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export default new AuthService();
```

### 2. Google Sign-In Button Component (`src/components/GoogleSignInButton.tsx`)

```typescript
import React, { useState } from 'react';
import authService from '../services/authService';

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      
      if (result.success && result.data) {
        onSuccess?.(result.data.user);
      } else {
        onError?.(result.message || 'Sign in failed');
      }
    } catch (error: any) {
      onError?.(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-3 w-full px-4 py-2
        bg-white border border-gray-300 rounded-lg
        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span className="text-gray-700 font-medium">
        {loading ? 'Signing in...' : 'Continue with Google'}
      </span>
    </button>
  );
};

export default GoogleSignInButton;
```

### 3. Auth Context (`src/contexts/AuthContext.tsx`)

```typescript
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authService, { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      // Handle redirect result first (for mobile)
      const redirectResult = await authService.handleRedirectResult();
      if (redirectResult?.success && redirectResult.data) {
        setUser(redirectResult.data.user);
        setLoading(false);
        return;
      }

      // Get current user profile
      if (authService.isAuthenticated()) {
        const profile = await authService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.data) {
      setUser(result.data.user);
    } else {
      throw new Error(result.message);
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    const result = await authService.signup(fullName, email, password);
    if (result.success && result.data) {
      setUser(result.data.user);
    } else {
      throw new Error(result.message);
    }
  };

  const loginWithGoogle = async () => {
    const result = await authService.signInWithGoogle();
    if (result.success && result.data) {
      setUser(result.data.user);
    } else {
      throw new Error(result.message);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

## TypeScript Types

### 1. API Types (`src/types/api.ts`)

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  authProvider: 'local' | 'google' | 'firebase';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface FirebaseVerifyRequest {
  idToken: string;
}
```

---

## Error Handling

### 1. Error Handler (`src/utils/errorHandler.ts`)

```typescript
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const handleAuthError = (error: any): string => {
  if (error.code) {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Popup was blocked by browser. Please allow popups and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return error.message || 'An authentication error occurred.';
    }
  }
  
  return error.message || 'An unexpected error occurred.';
};
```

---

## Usage Examples

### 1. Login Page

```typescript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    // User will be automatically set in context
    // Redirect handled by your app routing
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        className="mb-4"
      />

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
```

---

## Testing

### 1. Test the Integration

1. **Start your backend**: `npm start`
2. **Start your frontend**: `npm run dev`
3. **Test Google Sign-In**:
   - Click "Continue with Google" button
   - Complete Google OAuth flow
   - Verify JWT token is received and stored
   - Check user profile data

### 2. Environment Setup

Make sure your `.env` files are properly configured:

**Backend `.env`:**
```env
# Add to existing variables
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
```

**Frontend `.env`:**
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=documind-778a7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=documind-778a7
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_API_BASE_URL=http://localhost:3001
```

---

## Security Notes

1. **Always validate tokens on the server side**
2. **Use HTTPS in production**
3. **Implement proper CORS policies**
4. **Set secure session cookies**
5. **Rate limit authentication endpoints**
6. **Log authentication events for security monitoring**

This integration provides a robust authentication system with both traditional and modern OAuth flows, perfect for your React Vite TypeScript application!