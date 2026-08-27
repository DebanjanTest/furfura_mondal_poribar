// Role-Based Access Control (RBAC) Service for Mondol Barir Pujo
// External Admin & Editor role resolution via Google OAuth + Firebase Firestore

import { firebaseConfig } from './firebaseAuth.js';

export const SUPER_ADMIN_EMAIL = 'debanjanmondal8996@gmail.com';

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VISITOR: 'visitor'
};

// In-memory / session cache for lightning-fast role checks
const roleCache = new Map();

/**
 * Resolves the authenticated user's role:
 * 1. Super Admin: debanjanmondal8996@gmail.com -> 'admin' (hardcoded permanent authority)
 * 2. Firestore `user_roles/{email}` lookup: 'admin' or 'editor'
 * 3. Default fallback: 'visitor'
 */
export async function resolveUserRole(user) {
  if (!user || !user.email) {
    return ROLES.VISITOR;
  }

  const cleanEmail = user.email.trim().toLowerCase();

  // 1. Permanent Super Admin Check
  if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return ROLES.ADMIN;
  }

  // 2. Check local memory cache
  if (roleCache.has(cleanEmail)) {
    return roleCache.get(cleanEmail);
  }

  // 3. Query Firebase Firestore `user_roles` collection on-demand
  try {
    const [{ getFirestore, doc, getDoc }, { initializeApp, getApps, getApp }] = await Promise.all([
      import('firebase/firestore'),
      import('firebase/app')
    ]);
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const docRef = doc(db, 'user_roles', cleanEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const role = (data?.role || '').toLowerCase();
      if (role === ROLES.ADMIN) {
        roleCache.set(cleanEmail, ROLES.ADMIN);
        return ROLES.ADMIN;
      }
      if (role === ROLES.EDITOR) {
        roleCache.set(cleanEmail, ROLES.EDITOR);
        return ROLES.EDITOR;
      }
    }
  } catch (e) {
    console.warn('Firestore RBAC lookup deferred:', e);
  }

  // 4. Default to public visitor
  roleCache.set(cleanEmail, ROLES.VISITOR);
  return ROLES.VISITOR;
}

/**
 * Permissions Helper Methods
 */
export function canAccessPortal(role) {
  return role === ROLES.ADMIN || role === ROLES.EDITOR;
}

export function canUploadContent(role) {
  return role === ROLES.ADMIN || role === ROLES.EDITOR;
}

export function canEditContent(role) {
  return role === ROLES.ADMIN || role === ROLES.EDITOR;
}

export function canDeleteContent(role) {
  return role === ROLES.ADMIN || role === ROLES.EDITOR;
}

export function canManageAnnouncements(role) {
  return role === ROLES.ADMIN;
}
