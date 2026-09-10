import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAuthContext,
  loginWithGoogleLivePopup,
  loginWithGoogleRedirect,
  logoutUser,
  getStoredUser,
  setStoredUser,
  generateAvatarUrl
} from '../services/firebaseAuth.js';
import { resolveUserRole, ROLES } from '../services/rbacService.js';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [userRole, setUserRole] = useState(ROLES.VISITOR);
  const [isLoading, setIsLoading] = useState(true);

  // Sync role whenever user changes
  const refreshUserRole = useCallback(async (user) => {
    if (!user) {
      setUserRole(ROLES.VISITOR);
      return ROLES.VISITOR;
    }
    try {
      const role = await resolveUserRole(user);
      setUserRole(role);
      return role;
    } catch (e) {
      console.warn('Role resolution notice:', e);
      setUserRole(ROLES.VISITOR);
      return ROLES.VISITOR;
    }
  }, []);

  useEffect(() => {
    // Check initial cached user
    const cached = getStoredUser();
    if (cached) {
      setCurrentUser(cached);
      refreshUserRole(cached);
    }

    // Subscribe to Firebase live auth state
    let unsubscribe = () => {};
    const { auth: firebaseAuthInstance } = getAuthContext();
    if (firebaseAuthInstance) {
      try {
        unsubscribe = onAuthStateChanged(firebaseAuthInstance, async (firebaseUser) => {
          if (firebaseUser) {
            const role = await resolveUserRole(firebaseUser);
            const userData = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Devotee',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || generateAvatarUrl(firebaseUser.displayName, firebaseUser.email),
              role: role,
              isFirebaseLive: true
            };
            setCurrentUser(userData);
            setUserRole(role);
            setStoredUser(userData);
          } else {
            // Keep local guest user if marked guest
            const local = getStoredUser();
            if (local && local.isGuest) {
              setCurrentUser(local);
              setUserRole(ROLES.VISITOR);
            } else {
              setCurrentUser(null);
              setUserRole(ROLES.VISITOR);
              setStoredUser(null);
            }
          }
          setIsLoading(false);
        });
      } catch (err) {
        console.warn('Firebase onAuthStateChanged notice:', err);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, [refreshUserRole]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const user = await loginWithGoogleLivePopup();
      if (user) {
        const role = await resolveUserRole(user);
        const userData = {
          uid: user.uid,
          displayName: user.displayName || 'Devotee',
          email: user.email || '',
          photoURL: user.photoURL || generateAvatarUrl(user.displayName, user.email),
          role: role,
          isFirebaseLive: true
        };
        setCurrentUser(userData);
        setUserRole(role);
        setStoredUser(userData);
        return userData;
      }
    } catch (error) {
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        // Attempt redirect if popup blocked
        try {
          await loginWithGoogleRedirect();
        } catch (_) {}
      }
      throw error;
    }
  }, []);

  const signInAsGuest = useCallback(() => {
    const guestUser = {
      uid: 'guest-' + Date.now(),
      displayName: 'Guest Devotee',
      email: 'guest@mondalbarirpujo.in',
      photoURL: '/favicon.png',
      isGuest: true,
      role: ROLES.VISITOR
    };
    setCurrentUser(guestUser);
    setUserRole(ROLES.VISITOR);
    setStoredUser(guestUser);
    return guestUser;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutUser();
    } catch (_) {}
    setCurrentUser(null);
    setUserRole(ROLES.VISITOR);
    setStoredUser(null);
  }, []);

  const value = {
    currentUser,
    user: currentUser,
    userRole,
    isAdmin: userRole === ROLES.ADMIN,
    isEditor: userRole === ROLES.EDITOR || userRole === ROLES.ADMIN,
    isLoading,
    signInWithGoogle,
    signInAsGuest,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
