// Curated Content Store for Mondal Barir Pujo
// Synchronizes Photo River, Grand Gallery, and Onnota Creations across Portal and Public Site

import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './firebaseAuth.js';
import { nativePujoData, photoRiverRows, onnotaCreations } from '../data/playlists.js';
import { canUploadContent, canEditContent, canDeleteContent, canManageAnnouncements } from './rbacService.js';

const STORAGE_GALLERY_KEY = 'mondal_bari_curated_gallery_v2';
const STORAGE_ONNOTA_KEY = 'mondal_bari_curated_onnota_v2';
const STORAGE_ANNOUNCEMENT_KEY = 'mondal_bari_curated_announcement_v2';

let db = null;
try {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn('Firestore notice for Content Store:', e);
}

// Initial fallback seeds from native data
function getInitialGallerySeed() {
  const defaultList = [...(nativePujoData.gallery || [])];
  return defaultList.map((item, idx) => ({
    id: item.id || `native-gallery-${idx + 1}`,
    title: item.title || 'Mondal Bari Pujo Moment',
    title_bn: item.title || 'মন্ডল বাড়ির পুজো স্মৃতি',
    category: item.category || 'heritage',
    categoryLabel: item.categoryLabel || 'ঐতিহ্য ও পরিবার',
    src: item.src || '/og-image.png',
    author: item.author || 'ফুরফুরা মণ্ডল পরিবার',
    date: item.date || '২০২৬',
    likes: item.likes || 128,
    isCurated: true,
    target: 'both' // 'both', 'gallery', or 'river'
  }));
}

function getInitialOnnotaSeed() {
  return (onnotaCreations || []).map((item, idx) => ({
    id: item.id || `native-onnota-${idx + 1}`,
    title: item.title || 'Artisan Creation',
    title_bn: item.title_bn || 'শিল্পকলা সৃষ্টি',
    category: item.category || 'art',
    categoryLabel: item.categoryLabel || 'চিত্রশিল্প ও অলঙ্করণ',
    src: item.src || '/favicon.png',
    author: item.author || 'অন্যতা ক্রিয়েশনস',
    date: item.date || '২০২৬',
    likes: item.likes || 64,
    desc_bn: item.desc_bn || 'ঐতিহ্য ও শিল্পের মেলবন্ধন'
  }));
}

/* ==========================================================================
   1. GALLERY & PHOTO RIVER CRUD
   ========================================================================== */

export async function getCuratedGallery() {
  // 1. Check Local Cache first
  try {
    const cached = localStorage.getItem(STORAGE_GALLERY_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}

  // 2. Query Firestore if available
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'gallery_posts'));
      if (!snap.empty) {
        const firestoreList = [];
        snap.forEach((docSnap) => {
          firestoreList.push({ id: docSnap.id, ...docSnap.data() });
        });
        localStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(firestoreList));
        return firestoreList;
      }
    } catch (e) {
      console.warn('Firestore gallery load notice:', e);
    }
  }

  // 3. Fallback to Initial Seed
  const initial = getInitialGallerySeed();
  try {
    localStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(initial));
  } catch (_) {}
  return initial;
}

export async function addGalleryPhoto(photoData, user, role) {
  if (!canUploadContent(role)) {
    throw new Error('Unauthorized: You must have an Admin or Editor role to upload photos.');
  }

  const newId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item = {
    id: newId,
    title: photoData.title || photoData.title_bn || 'Mondal Bari Durga Puja',
    title_bn: photoData.title_bn || photoData.title || 'মন্ডল বাড়ির পুজো স্মৃতি',
    category: photoData.category || 'heritage',
    categoryLabel: photoData.categoryLabel || 'ঐতিহ্য ও পরিবার',
    src: photoData.src, // Base64 data URL or hosted image URL
    author: photoData.author || user?.displayName || 'ফুরফুরা মণ্ডল পরিবার',
    uploaderEmail: user?.email || '',
    uploaderRole: role,
    date: photoData.date || new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
    likes: 0,
    target: photoData.target || 'both', // 'gallery', 'river', or 'both'
    createdAt: new Date().toISOString()
  };

  // Save to Local Storage
  const current = await getCuratedGallery();
  const updated = [item, ...current];
  localStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(updated));

  // Sync to Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'gallery_posts', newId), item);
    } catch (err) {
      console.warn('Firestore save notice:', err);
    }
  }

  window.dispatchEvent(new CustomEvent('mondal_bari_content_updated', { detail: { type: 'gallery' } }));
  return item;
}

export async function updateGalleryPhoto(id, updates, user, role) {
  if (!canEditContent(role)) {
    throw new Error('Unauthorized: You must have an Admin or Editor role to edit photos.');
  }

  const current = await getCuratedGallery();
  const idx = current.findIndex(p => p.id === id);
  if (idx === -1) {
    throw new Error('Photo not found.');
  }

  current[idx] = {
    ...current[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: user?.email || ''
  };

  localStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(current));

  if (db) {
    try {
      await updateDoc(doc(db, 'gallery_posts', id), updates);
    } catch (err) {
      console.warn('Firestore update notice:', err);
    }
  }

  window.dispatchEvent(new CustomEvent('mondal_bari_content_updated', { detail: { type: 'gallery' } }));
  return current[idx];
}

export async function deleteGalleryPhoto(id, user, role) {
  if (!canDeleteContent(role)) {
    throw new Error('Unauthorized: You must have an Admin or Editor role to delete photos.');
  }

  const current = await getCuratedGallery();
  const updated = current.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(updated));

  if (db) {
    try {
      await deleteDoc(doc(db, 'gallery_posts', id));
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }
  }

  window.dispatchEvent(new CustomEvent('mondal_bari_content_updated', { detail: { type: 'gallery' } }));
  return true;
}

/* ==========================================================================
   2. ONNOTA CREATIONS CRUD
   ========================================================================== */

export async function getCuratedOnnota() {
  try {
    const cached = localStorage.getItem(STORAGE_ONNOTA_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'onnota_posts'));
      if (!snap.empty) {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        localStorage.setItem(STORAGE_ONNOTA_KEY, JSON.stringify(list));
        return list;
      }
    } catch (e) {}
  }

  const initial = getInitialOnnotaSeed();
  try {
    localStorage.setItem(STORAGE_ONNOTA_KEY, JSON.stringify(initial));
  } catch (_) {}
  return initial;
}

export async function addOnnotaCreation(itemData, user, role) {
  if (!canUploadContent(role)) throw new Error('Unauthorized.');

  const newId = `onnota-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item = {
    id: newId,
    title: itemData.title || itemData.title_bn || 'Onnota Creation',
    title_bn: itemData.title_bn || itemData.title || 'অন্যতা সৃষ্টি',
    category: itemData.category || 'art',
    categoryLabel: itemData.categoryLabel || 'চিত্রশিল্প ও অলঙ্করণ',
    src: itemData.src,
    author: itemData.author || 'অন্যতা',
    desc_bn: itemData.desc_bn || '',
    date: itemData.date || '২০২৬',
    likes: 0,
    createdAt: new Date().toISOString(),
    uploaderEmail: user?.email || ''
  };

  const current = await getCuratedOnnota();
  const updated = [item, ...current];
  localStorage.setItem(STORAGE_ONNOTA_KEY, JSON.stringify(updated));

  if (db) {
    try {
      await setDoc(doc(db, 'onnota_posts', newId), item);
    } catch (_) {}
  }

  window.dispatchEvent(new CustomEvent('mondal_bari_content_updated', { detail: { type: 'onnota' } }));
  return item;
}

export async function deleteOnnotaCreation(id, user, role) {
  if (!canDeleteContent(role)) throw new Error('Unauthorized.');

  const current = await getCuratedOnnota();
  const updated = current.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_ONNOTA_KEY, JSON.stringify(updated));

  if (db) {
    try {
      await deleteDoc(doc(db, 'onnota_posts', id));
    } catch (_) {}
  }

  window.dispatchEvent(new CustomEvent('mondal_bari_content_updated', { detail: { type: 'onnota' } }));
  return true;
}

/* ==========================================================================
   3. ANNOUNCEMENTS (ADMIN ONLY)
   ========================================================================== */

export async function getLiveAnnouncement() {
  try {
    const cached = localStorage.getItem(STORAGE_ANNOUNCEMENT_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}
  return {
    enabled: false,
    text_bn: 'মন্ডল বাড়ির সাবেকি দুর্গাপূজা ২০২৬ — সানন্দ আমন্ত্রণ!',
    text_en: 'Mondal Barir Durga Puja 2026 — Cordial Invitation!'
  };
}

export async function updateLiveAnnouncement(announcement, user, role) {
  if (!canManageAnnouncements(role)) {
    throw new Error('Unauthorized: Only Admin can update system announcements.');
  }

  localStorage.setItem(STORAGE_ANNOUNCEMENT_KEY, JSON.stringify(announcement));
  if (db) {
    try {
      await setDoc(doc(db, 'config', 'announcement'), announcement);
    } catch (_) {}
  }
  window.dispatchEvent(new CustomEvent('mondal_bari_content_updated', { detail: { type: 'announcement' } }));
  return announcement;
}
