// Firebase Modular Authentication Service for Mondal Barir Pujo
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

function getAuthContext() {
  if (!auth) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: 'select_account' });

      // Automatically process Google OAuth Redirect Results upon page return
      getRedirectResult(auth).then((result) => {
        if (result && result.user) {
          const user = {
            uid: result.user.uid,
            displayName: result.user.displayName || 'Devotee',
            email: result.user.email || '',
            photoURL: result.user.photoURL || generateAvatarUrl(result.user.displayName, result.user.email),
            isFirebaseLive: true
          };
          setStoredUser(user);
          if (typeof window !== 'undefined' && typeof window.completePujoUserLogin === 'function') {
            window.completePujoUserLogin(user);
          }
        }
      }).catch((e) => {
        console.warn('Redirect Auth handling notice:', e);
      });
    } catch (e) {
      console.warn('Firebase initialization note:', e?.message || e);
    }
  }
  return { app, auth, googleProvider };
}

let gsiScriptPromise = null;
export function loadGoogleGsiScript() {
  if (gsiScriptPromise) return gsiScriptPromise;
  gsiScriptPromise = new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
  return gsiScriptPromise;
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
 * Directly execute live Google popup OAuth
 */
export function loginWithGoogleLivePopup() {
  const { auth, googleProvider } = getAuthContext();
  if (!auth || !googleProvider) {
    return Promise.reject(new Error('Firebase Auth instance is not initialized.'));
  }
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, googleProvider).then((result) => {
    const user = {
      uid: result.user.uid,
      displayName: result.user.displayName || 'Devotee',
      email: result.user.email || '',
      photoURL: result.user.photoURL || generateAvatarUrl(result.user.displayName, result.user.email),
      isFirebaseLive: true
    };
    setStoredUser(user);
    return user;
  });
}

/**
 * Execute Google Sign-In via Full-Page Redirect (Bypasses popup blockers completely)
 */
export async function loginWithGoogleRedirect() {
  const { auth, googleProvider } = getAuthContext();
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth instance is not initialized.');
  }
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  await signInWithRedirect(auth, googleProvider);
}

export async function loginWithGoogle() {
  return loginWithGoogleLivePopup();
}

export async function logoutUser() {
  try {
    const { auth } = getAuthContext();
    if (auth) {
      await signOut(auth).catch(() => {});
    }
  } catch (_) {}
  setStoredUser(null);
}

export function subscribeAuthState(callback) {
  authListeners.add(callback);

  const { auth } = getAuthContext();
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
  const { auth } = getAuthContext();
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
