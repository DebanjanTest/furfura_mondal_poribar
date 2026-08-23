// Firebase Modular Authentication Service (Optional Google Login)
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

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

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (e) {
  console.warn('Firebase initialization note:', e?.message || e);
}

export async function loginWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is initializing. Please check configuration.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error('Google Sign-in status:', error);
    throw error;
  }
}

export async function logoutUser() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export function subscribeAuthState(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      });
    } else {
      callback(null);
    }
  });
}

export function getCurrentUser() {
  if (!auth || !auth.currentUser) return null;
  const u = auth.currentUser;
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL
  };
}
