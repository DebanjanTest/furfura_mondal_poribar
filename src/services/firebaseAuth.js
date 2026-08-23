// Firebase Modular Authentication Service for Mondal Barir Pujo
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const STORAGE_KEY = 'mondal_bari_auth_user';

// Authentic Firebase Project Configuration for Mondal Barir Pujo
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDTIahFo-QmOsZcGft5SxOSmslJsW_Jm-Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mondal-barir-pujo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mondal-barir-pujo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mondal-barir-pujo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "988253678071",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:988253678071:web:bf4a14d991484683c8a6f2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L5Q056X418"
};

let app = null;
let auth = null;
let googleProvider = null;
const authListeners = new Set();

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  console.log('Firebase Authentication initialized for Mondal Barir Pujo.');
} catch (e) {
  console.warn('Firebase initialization note:', e?.message || e);
}

// Generate an authentic avatar URL with colored initial
export function generateAvatarUrl(name = 'Devotee', email = '') {
  const cleanName = encodeURIComponent(name.trim() || 'D');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=d97706&color=fff&bold=true&rounded=true&size=128`;
}

// Get saved user session from LocalStorage
function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

// Save user session
export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    notifyAuthSubscribers(user);
  } catch (e) {
    console.warn('Could not save user session:', e);
  }
}

function notifyAuthSubscribers(user) {
  authListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (_) {}
  });
}

/**
 * Execute Google Sign-In via Firebase Authentication Popup
 */

/**
 * Directly execute live Google popup OAuth
 */
export async function loginWithGoogleLivePopup() {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth instance is not initialized.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  const user = {
    uid: result.user.uid,
    displayName: result.user.displayName || 'Devotee',
    email: result.user.email || '',
    photoURL: result.user.photoURL || generateAvatarUrl(result.user.displayName, result.user.email),
    isFirebaseLive: true
  };
  setStoredUser(user);
  return user;
}

export async function loginWithGoogle() {
  if (auth && googleProvider) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = {
        uid: result.user.uid,
        displayName: result.user.displayName || 'Devotee',
        email: result.user.email || '',
        photoURL: result.user.photoURL || generateAvatarUrl(result.user.displayName, result.user.email),
        isFirebaseLive: true
      };
      setStoredUser(user);
      return user;
    } catch (firebaseErr) {
      // If user closed popup intentionally, don't throw harsh error
      if (firebaseErr.code === 'auth/popup-closed-by-user' || firebaseErr.code === 'auth/cancelled-popup-request') {
        console.log('Google Sign-In popup was closed by user.');
        return null;
      }
      console.warn('Firebase Google Sign-In encountered issue:', firebaseErr);
      
      // If domain is unauthorized or popup blocked, launch the friendly account selector
      if (typeof window !== 'undefined' && typeof window.openGoogleAuthModal === 'function') {
        return new Promise((resolve) => {
          window.openGoogleAuthModal((userData) => {
            setStoredUser(userData);
            resolve(userData);
          });
        });
      }
      throw firebaseErr;
    }
  }

  // Fallback if auth instance not ready
  if (typeof window !== 'undefined' && typeof window.openGoogleAuthModal === 'function') {
    return new Promise((resolve) => {
      window.openGoogleAuthModal((userData) => {
        setStoredUser(userData);
        resolve(userData);
      });
    });
  }
  return null;
}

export async function logoutUser() {
  try {
    if (auth) {
      await signOut(auth).catch(() => {});
    }
  } catch (_) {}
  setStoredUser(null);
}

export function subscribeAuthState(callback) {
  authListeners.add(callback);

  // Check Firebase live auth state
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const u = {
          uid: user.uid,
          displayName: user.displayName || 'Devotee',
          email: user.email || '',
          photoURL: user.photoURL || generateAvatarUrl(user.displayName, user.email),
          isFirebaseLive: true
        };
        setStoredUser(u);
      }
    });
  }

  // Immediately notify initial stored state
  callback(getCurrentUser());

  return () => {
    authListeners.delete(callback);
  };
}

export function getCurrentUser() {
  if (auth && auth.currentUser) {
    const u = auth.currentUser;
    return {
      uid: u.uid,
      displayName: u.displayName || 'Devotee',
      email: u.email || '',
      photoURL: u.photoURL || generateAvatarUrl(u.displayName, u.email),
      isFirebaseLive: true
    };
  }
  return getStoredUser();
}
