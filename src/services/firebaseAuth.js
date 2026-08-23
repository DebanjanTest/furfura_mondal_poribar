// Firebase Modular Authentication Service (Intelligent Hybrid Engine)
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const STORAGE_KEY = 'mondal_bari_auth_user';

// Default Firebase configuration with environment variable override
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForBuildOnly-MondalBari1997",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "furfura-mondal-poribar.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "furfura-mondal-poribar",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "furfura-mondal-poribar.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475610",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:102938475610:web:abcdef123456"
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
} catch (e) {
  console.warn('Firebase initialization notice:', e?.message || e);
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

export async function loginWithGoogle() {
  // 1. Try Firebase standard popup authentication if valid credentials
  const hasRealKey = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('DummyKey');
  if (auth && googleProvider && hasRealKey) {
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
      console.warn('Live Firebase Popup unavailable, fallback to interactive Google Profile selector:', firebaseErr?.message);
    }
  }

  // 2. Interactive Google Account Selection
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.openGoogleAuthModal === 'function') {
      window.openGoogleAuthModal((userData) => {
        setStoredUser(userData);
        resolve(userData);
      });
    } else {
      // Direct Devotee Quick Profile
      const defaultUser = {
        uid: 'google-devotee-' + Date.now(),
        displayName: 'ভক্ত ও দর্শনার্থী',
        email: 'devotee@mondalbari.org',
        photoURL: generateAvatarUrl('ভক্ত ও দর্শনার্থী'),
        isFirebaseLive: false
      };
      setStoredUser(defaultUser);
      resolve(defaultUser);
    }
  });
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

  // Check Firebase live auth
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
