// Heritage Curator Portal Controller for Mondal Barir Pujo
// Built with Ponytail Architectural, Internationalization (i18n), & Accessibility Standards

import {
  loginWithGoogleLivePopup,
  logoutUser,
  subscribeAuthState,
  getCurrentUser
} from './services/firebaseAuth.js';
import {
  resolveUserRole,
  ROLES,
  canAccessPortal,
  canManageAnnouncements
} from './services/rbacService.js';
import {
  getCuratedGallery,
  addGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  getCuratedOnnota,
  addOnnotaCreation,
  deleteOnnotaCreation,
  getLiveAnnouncement,
  updateLiveAnnouncement
} from './services/contentStore.js';
import {
  getLanguage,
  setLanguage,
  getSavedLanguage,
  t,
  applyTranslations,
  formatNumber
} from './utils/i18n.js';

let currentUser = null;
let currentRole = ROLES.VISITOR;

// Cached file buffers
let pendingGalleryBase64 = null;
let pendingOnnotaBase64 = null;

document.addEventListener('DOMContentLoaded', () => {
  initPortalLanguage();
  initPortalAuth();
  initPortalTabs();
  initGalleryManager();
  initOnnotaManager();
  initAnnouncementsManager();
});

/* ==========================================================================
   1. LANGUAGE SELECTION & LOCALIZATION ENGINE
   ========================================================================== */

function initPortalLanguage() {
  const initialLang = getSavedLanguage();
  setLanguage(initialLang);
  syncPortalLangUI(initialLang);

  // Top Nav Language Toggle Button
  const langToggleBtn = document.getElementById('btn-portal-lang-toggle');
  langToggleBtn?.addEventListener('click', () => {
    const nextLang = getLanguage() === 'bn' ? 'en' : 'bn';
    setLanguage(nextLang);
    loadAllDashboardData();
  });

  // Auth Gate & Access Denied Language Buttons
  document.querySelectorAll('.portal-auth-lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextLang = btn.getAttribute('data-lang');
      if (nextLang && nextLang !== getLanguage()) {
        setLanguage(nextLang);
        loadAllDashboardData();
      }
    });
  });

  // Global Language Synchronization
  window.addEventListener('pujo_language_changed', (e) => {
    syncPortalLangUI(e.detail?.lang || getLanguage());
  });
}

function syncPortalLangUI(lang) {
  const langText = document.getElementById('portal-lang-text');
  if (langText) {
    langText.textContent = lang === 'bn' ? 'বাংলা' : 'English';
  }

  document.querySelectorAll('.portal-auth-lang-btn').forEach((btn) => {
    const isMatch = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('active', isMatch);
    btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
  });

  if (currentUser) {
    updateNavUserInfo(currentUser, currentRole);
  }
}

/* ==========================================================================
   2. AUTHENTICATION & ROLE GATEKEEPER
   ========================================================================== */

function initPortalAuth() {
  const btnLogin = document.getElementById('btn-portal-google-login');
  const btnLogout = document.getElementById('btn-portal-logout');
  const btnSwitch = document.getElementById('btn-portal-switch-account');

  const handleLogin = async () => {
    const lang = getLanguage();
    try {
      showPortalToast(lang === 'bn' ? 'Google সাইন ইন প্রক্রিয়া শুরু হচ্ছে...' : 'Initiating Google Sign In...');
      await loginWithGoogleLivePopup();
    } catch (err) {
      console.warn('Portal login error:', err);
      showPortalToast(lang === 'bn' ? 'সাইন ইন বাতিল বা ত্রুটিপূর্ণ হয়েছে।' : 'Sign-in cancelled or failed.');
    }
  };

  btnLogin?.addEventListener('click', handleLogin);
  btnSwitch?.addEventListener('click', handleLogin);

  btnLogout?.addEventListener('click', async () => {
    const lang = getLanguage();
    await logoutUser();
    showPortalToast(lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে।' : 'Signed out successfully.');
  });

  // Listen to live Firebase Auth state
  subscribeAuthState(async (user) => {
    currentUser = user;
    if (!user) {
      currentRole = ROLES.VISITOR;
      renderAuthScreen('gate');
      return;
    }

    // Resolve Role
    const lang = getLanguage();
    showPortalToast(lang === 'bn' ? 'অনুমোদন যাচাই করা হচ্ছে...' : 'Verifying curator permissions...');
    currentRole = await resolveUserRole(user);

    if (canAccessPortal(currentRole)) {
      renderAuthScreen('dashboard');
      updateNavUserInfo(user, currentRole);
      loadAllDashboardData();
    } else {
      renderAuthScreen('denied', user);
    }
  });
}

function renderAuthScreen(state, user = null) {
  const gateEl = document.getElementById('portal-auth-gate');
  const deniedEl = document.getElementById('portal-access-denied');
  const dashEl = document.getElementById('portal-dashboard');
  const deniedText = document.getElementById('denied-user-text');
  const lang = getLanguage();

  if (state === 'gate') {
    if (gateEl) gateEl.style.display = 'flex';
    if (deniedEl) deniedEl.style.display = 'none';
    if (dashEl) dashEl.style.display = 'none';
  } else if (state === 'denied') {
    if (gateEl) gateEl.style.display = 'none';
    if (deniedEl) deniedEl.style.display = 'flex';
    if (dashEl) dashEl.style.display = 'none';
    if (deniedText && user) {
      deniedText.innerHTML = lang === 'bn'
        ? `আপনার Google অ্যাকাউন্ট <strong>(${user.email})</strong> ফুরফুরা মণ্ডল পরিবারের কিউরেটর বা এডিটর হিসেবে তালিকাভুক্ত নয়।`
        : `Your Google account <strong>(${user.email})</strong> is not listed as an authorized Curator or Editor.`;
    }
  } else if (state === 'dashboard') {
    if (gateEl) gateEl.style.display = 'none';
    if (deniedEl) deniedEl.style.display = 'none';
    if (dashEl) dashEl.style.display = 'flex';
  }
}

function updateNavUserInfo(user, role) {
  const roleBadge = document.getElementById('nav-role-badge');
  const avatarImg = document.getElementById('nav-user-avatar');
  const nameEl = document.getElementById('nav-user-name');
  const announcementsTabBtn = document.getElementById('tab-btn-announcements');
  const lang = getLanguage();

  if (roleBadge) {
    if (role === ROLES.ADMIN) {
      roleBadge.textContent = lang === 'bn' ? 'সুপার অ্যাডমিন' : 'Super Admin';
      roleBadge.style.borderColor = 'var(--portal-gold)';
      roleBadge.style.color = 'var(--portal-gold)';
    } else {
      roleBadge.textContent = lang === 'bn' ? 'কনটেন্ট এডিটর' : 'Content Editor';
      roleBadge.style.borderColor = '#60a5fa';
      roleBadge.style.color = '#93c5fd';
    }
  }

  if (avatarImg) avatarImg.src = user.photoURL || '/favicon.png';
  if (nameEl) nameEl.textContent = user.displayName || user.email;

  // Restrict Announcements tab if not admin
  if (announcementsTabBtn) {
    announcementsTabBtn.style.opacity = canManageAnnouncements(role) ? '1' : '0.5';
    announcementsTabBtn.title = canManageAnnouncements(role) 
      ? '' 
      : (lang === 'bn' ? 'শুধুমাত্র সুপার অ্যাডমিন' : 'Super Admin only');
  }
}

/* ==========================================================================
   3. DASHBOARD TABS
   ========================================================================== */

function initPortalTabs() {
  const tabBtns = document.querySelectorAll('.portal-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const activePanel = document.getElementById(`tab-content-${targetTab}`);
      if (activePanel) activePanel.classList.add('active');
    });
  });
}

function loadAllDashboardData() {
  renderCuratedGalleryList();
  renderCuratedOnnotaList();
  loadAnnouncementForm();
}

/* ==========================================================================
   4. GALLERY & PHOTO RIVER MANAGER
   ========================================================================== */

function initGalleryManager() {
  const dropzone = document.getElementById('portal-dropzone');
  const fileInput = document.getElementById('input-gallery-file');
  const promptEl = document.getElementById('dropzone-prompt');
  const previewEl = document.getElementById('dropzone-preview');
  const previewImg = document.getElementById('preview-img');
  const clearBtn = document.getElementById('btn-clear-preview');
  const form = document.getElementById('form-upload-gallery');
  const searchInput = document.getElementById('search-gallery-input');

  dropzone?.addEventListener('click', (e) => {
    if (e.target !== clearBtn) fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file, (dataUrl) => {
      pendingGalleryBase64 = dataUrl;
      if (previewImg) previewImg.src = dataUrl;
      if (promptEl) promptEl.style.display = 'none';
      if (previewEl) previewEl.style.display = 'block';
    });
  });

  clearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    pendingGalleryBase64 = null;
    if (fileInput) fileInput.value = '';
    if (promptEl) promptEl.style.display = 'flex';
    if (previewEl) previewEl.style.display = 'none';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lang = getLanguage();
    if (!pendingGalleryBase64) {
      showPortalToast(lang === 'bn' ? 'দয়া করে একটি ছবি নির্বাচন করুন!' : 'Please select an image to upload!');
      return;
    }

    const titleBn = document.getElementById('input-title-bn')?.value.trim();
    const titleEn = document.getElementById('input-title-en')?.value.trim();
    const category = document.getElementById('select-category')?.value;
    const target = document.getElementById('select-target')?.value;
    const author = document.getElementById('input-author')?.value.trim() || (lang === 'bn' ? 'ফুরফুরা মণ্ডল পরিবার' : 'Furfura Mondal Poribar');

    const catLabelsBn = {
      heritage: 'ঐতিহ্য ও পরিবার',
      idols: 'প্রতিমা ও বরণ',
      dhunuchi: 'ধুনুচি ও আরতি',
      autumn: 'শরতের আগমনী',
      community: 'ভক্তদের স্মৃতি'
    };

    try {
      showPortalToast(lang === 'bn' ? 'ছবি প্রকাশিত হচ্ছে...' : 'Publishing photo to website...');
      await addGalleryPhoto({
        title: titleEn || titleBn,
        title_bn: titleBn,
        category: category,
        categoryLabel: catLabelsBn[category] || 'ঐতিহ্য',
        src: pendingGalleryBase64,
        author: author,
        target: target
      }, currentUser, currentRole);

      showPortalToast(lang === 'bn' ? 'ছবি সফলভাবে প্রকাশিত হয়েছে!' : 'Photo successfully published to website!');
      form.reset();
      clearBtn?.click();
      renderCuratedGalleryList();
    } catch (err) {
      showPortalToast(`${lang === 'bn' ? 'ত্রুটি' : 'Error'}: ${err.message}`);
    }
  });

  searchInput?.addEventListener('input', () => {
    renderCuratedGalleryList(searchInput.value.trim());
  });

  initEditModal();
}

async function renderCuratedGalleryList(query = '') {
  const container = document.getElementById('curated-gallery-list');
  const countBadge = document.getElementById('gallery-count-badge');
  const lang = getLanguage();
  if (!container) return;

  const items = await getCuratedGallery();
  const filtered = query
    ? items.filter(i => (i.title_bn || '').toLowerCase().includes(query.toLowerCase()) || 
                        (i.title || '').toLowerCase().includes(query.toLowerCase()) || 
                        (i.categoryLabel || '').includes(query))
    : items;

  if (countBadge) {
    countBadge.textContent = lang === 'bn' 
      ? `${formatNumber(items.length, 'bn')}টি ছবি` 
      : `${formatNumber(items.length, 'en')} Photos`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--portal-text-muted); padding: 2rem;">${lang === 'bn' ? 'কোনো ছবি পাওয়া যায়নি।' : 'No photographs found.'}</div>`;
    return;
  }

  const editLabel = lang === 'bn' ? 'সম্পাদনা' : 'Edit';
  const deleteLabel = lang === 'bn' ? 'মুছুন' : 'Delete';

  container.innerHTML = filtered.map((item) => `
    <div class="curated-item-card" data-id="${item.id}">
      <div class="item-card-left">
        <img src="${item.src}" alt="${item.title_bn || item.title}" class="item-thumb-img" loading="lazy" />
        <div class="item-details">
          <span class="item-title">${lang === 'bn' ? (item.title_bn || item.title) : (item.title || item.title_bn)}</span>
          <div class="item-meta-row">
            <span class="item-cat-badge">${item.categoryLabel || item.category}</span>
            <span>•</span>
            <span>${item.author || (lang === 'bn' ? 'মণ্ডল পরিবার' : 'Mondal Poribar')}</span>
          </div>
        </div>
      </div>
      <div class="item-card-actions">
        <button type="button" class="btn-item-edit" data-edit-id="${item.id}" title="${editLabel}">${editLabel}</button>
        <button type="button" class="btn-item-delete" data-delete-id="${item.id}" title="${deleteLabel}">${deleteLabel}</button>
      </div>
    </div>
  `).join('');

  // Attach Edit & Delete Listeners
  container.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-id');
      const item = items.find(p => p.id === id);
      if (item) openEditModal(item);
    });
  });

  container.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-id');
      const confirmMsg = lang === 'bn' 
        ? 'আপনি কি নিশ্চিত যে এই ছবিটি ওয়েবসাইট থেকে স্থায়ীভাবে মুছে ফেলতে চান?' 
        : 'Are you sure you want to permanently delete this photo from the website?';
      if (confirm(confirmMsg)) {
        try {
          await deleteGalleryPhoto(id, currentUser, currentRole);
          showPortalToast(lang === 'bn' ? 'ছবি সফলভাবে মুছে ফেলা হয়েছে।' : 'Photo deleted successfully.');
          renderCuratedGalleryList();
        } catch (err) {
          showPortalToast(`${lang === 'bn' ? 'ত্রুটি' : 'Error'}: ${err.message}`);
        }
      }
    });
  });
}

function initEditModal() {
  const modal = document.getElementById('modal-edit-gallery');
  const closeBtn = document.getElementById('btn-close-edit-modal');
  const cancelBtn = document.getElementById('btn-cancel-edit');
  const form = document.getElementById('form-edit-gallery');

  const closeModal = () => {
    if (modal) modal.style.display = 'none';
  };

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lang = getLanguage();
    const id = document.getElementById('edit-item-id')?.value;
    const titleBn = document.getElementById('edit-title-bn')?.value.trim();
    const category = document.getElementById('edit-category')?.value;
    const author = document.getElementById('edit-author')?.value.trim();

    const catLabelsBn = {
      heritage: 'ঐতিহ্য ও পরিবার',
      idols: 'প্রতিমা ও বরণ',
      dhunuchi: 'ধুনুচি ও আরতি',
      autumn: 'শরতের আগমনী',
      community: 'ভক্তদের স্মৃতি'
    };

    try {
      await updateGalleryPhoto(id, {
        title_bn: titleBn,
        category: category,
        categoryLabel: catLabelsBn[category] || 'ঐতিহ্য',
        author: author
      }, currentUser, currentRole);

      showPortalToast(lang === 'bn' ? 'ছবির তথ্য সফলভাবে সংরক্ষিত হয়েছে!' : 'Photo details saved successfully!');
      closeModal();
      renderCuratedGalleryList();
    } catch (err) {
      showPortalToast(`${lang === 'bn' ? 'ত্রুটি' : 'Error'}: ${err.message}`);
    }
  });
}

function openEditModal(item) {
  const modal = document.getElementById('modal-edit-gallery');
  const idInput = document.getElementById('edit-item-id');
  const titleInput = document.getElementById('edit-title-bn');
  const catSelect = document.getElementById('edit-category');
  const authorInput = document.getElementById('edit-author');

  if (idInput) idInput.value = item.id;
  if (titleInput) titleInput.value = item.title_bn || item.title || '';
  if (catSelect) catSelect.value = item.category || 'heritage';
  if (authorInput) authorInput.value = item.author || '';

  if (modal) modal.style.display = 'flex';
}

/* ==========================================================================
   5. ONNOTA CREATIONS STUDIO
   ========================================================================== */

function initOnnotaManager() {
  const dropzone = document.getElementById('onnota-dropzone');
  const fileInput = document.getElementById('input-onnota-file');
  const promptEl = document.getElementById('onnota-dropzone-prompt');
  const previewEl = document.getElementById('onnota-dropzone-preview');
  const previewImg = document.getElementById('onnota-preview-img');
  const clearBtn = document.getElementById('btn-clear-onnota-preview');
  const form = document.getElementById('form-upload-onnota');

  dropzone?.addEventListener('click', (e) => {
    if (e.target !== clearBtn) fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file, (dataUrl) => {
      pendingOnnotaBase64 = dataUrl;
      if (previewImg) previewImg.src = dataUrl;
      if (promptEl) promptEl.style.display = 'none';
      if (previewEl) previewEl.style.display = 'block';
    });
  });

  clearBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    pendingOnnotaBase64 = null;
    if (fileInput) fileInput.value = '';
    if (promptEl) promptEl.style.display = 'flex';
    if (previewEl) previewEl.style.display = 'none';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lang = getLanguage();
    if (!pendingOnnotaBase64) {
      showPortalToast(lang === 'bn' ? 'দয়া করে সৃষ্টির ছবি নির্বাচন করুন!' : 'Please select creation artwork!');
      return;
    }

    const titleBn = document.getElementById('input-onnota-title-bn')?.value.trim();
    const category = document.getElementById('select-onnota-cat')?.value;
    const desc = document.getElementById('input-onnota-desc')?.value.trim();

    const catLabelsBn = {
      art: 'চিত্রশিল্প ও অলঙ্করণ',
      alpona: 'হস্তশিল্প ও আলপনা',
      photo: 'উৎসব আলোকচিত্র',
      literature: 'সাহিত্য ও স্মৃতিচারণ'
    };

    try {
      await addOnnotaCreation({
        title_bn: titleBn,
        category: category,
        categoryLabel: catLabelsBn[category] || 'শিল্পকলা',
        desc_bn: desc,
        src: pendingOnnotaBase64
      }, currentUser, currentRole);

      showPortalToast(lang === 'bn' ? 'অন্যতা সৃষ্টি সফলভাবে প্রকাশিত হয়েছে!' : 'Onnota artwork published successfully!');
      form.reset();
      clearBtn?.click();
      renderCuratedOnnotaList();
    } catch (err) {
      showPortalToast(`${lang === 'bn' ? 'ত্রুটি' : 'Error'}: ${err.message}`);
    }
  });
}

async function renderCuratedOnnotaList() {
  const container = document.getElementById('curated-onnota-list');
  const countBadge = document.getElementById('onnota-count-badge');
  const lang = getLanguage();
  if (!container) return;

  const items = await getCuratedOnnota();
  if (countBadge) {
    countBadge.textContent = lang === 'bn' 
      ? `${formatNumber(items.length, 'bn')}টি সৃষ্টি` 
      : `${formatNumber(items.length, 'en')} Creations`;
  }

  if (items.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--portal-text-muted); padding: 2rem;">${lang === 'bn' ? 'কোনো সৃষ্টি পাওয়া যায়নি।' : 'No creations found.'}</div>`;
    return;
  }

  const deleteLabel = lang === 'bn' ? 'মুছুন' : 'Delete';

  container.innerHTML = items.map((item) => `
    <div class="curated-item-card" data-id="${item.id}">
      <div class="item-card-left">
        <img src="${item.src}" alt="${item.title_bn || item.title}" class="item-thumb-img" loading="lazy" />
        <div class="item-details">
          <span class="item-title">${item.title_bn || item.title}</span>
          <div class="item-meta-row">
            <span class="item-cat-badge">${item.categoryLabel || item.category}</span>
          </div>
        </div>
      </div>
      <div class="item-card-actions">
        <button type="button" class="btn-item-delete" data-onnota-del="${item.id}">${deleteLabel}</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-onnota-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-onnota-del');
      const confirmMsg = lang === 'bn' 
        ? 'আপনি কি এই অন্যতা সৃষ্টিটি মুছে ফেলতে চান?' 
        : 'Are you sure you want to delete this creation?';
      if (confirm(confirmMsg)) {
        await deleteOnnotaCreation(id, currentUser, currentRole);
        showPortalToast(lang === 'bn' ? 'সৃষ্টি মুছে ফেলা হয়েছে।' : 'Creation deleted successfully.');
        renderCuratedOnnotaList();
      }
    });
  });
}

/* ==========================================================================
   6. ANNOUNCEMENTS (ADMIN ONLY)
   ========================================================================== */

function initAnnouncementsManager() {
  const form = document.getElementById('form-announcement');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lang = getLanguage();
    if (!canManageAnnouncements(currentRole)) {
      showPortalToast(lang === 'bn' 
        ? 'অনুমোদন নেই: শুধুমাত্র সুপার অ্যাডমিন ঘোষণা পরিবর্তন করতে পারেন।' 
        : 'Permission denied: Only Super Admin can broadcast announcements.');
      return;
    }

    const enabled = document.getElementById('check-announcement-enabled')?.checked;
    const textBn = document.getElementById('input-announcement-bn')?.value.trim();
    const textEn = document.getElementById('input-announcement-en')?.value.trim();

    try {
      await updateLiveAnnouncement({
        enabled: enabled,
        text_bn: textBn,
        text_en: textEn
      }, currentUser, currentRole);
      showPortalToast(lang === 'bn' ? 'ঘোষণা সংরক্ষিত ও প্রচার করা হয়েছে!' : 'Announcement saved and broadcasted!');
    } catch (err) {
      showPortalToast(`${lang === 'bn' ? 'ত্রুটি' : 'Error'}: ${err.message}`);
    }
  });
}

async function loadAnnouncementForm() {
  const announcement = await getLiveAnnouncement();
  const checkEl = document.getElementById('check-announcement-enabled');
  const bnEl = document.getElementById('input-announcement-bn');
  const enEl = document.getElementById('input-announcement-en');

  if (checkEl) checkEl.checked = !!announcement?.enabled;
  if (bnEl) bnEl.value = announcement?.text_bn || '';
  if (enEl) enEl.value = announcement?.text_en || '';
}

/* ==========================================================================
   7. UTILITIES
   ========================================================================== */

function handleImageFile(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDimension = 1400;
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/webp', 0.88);
      callback(compressedDataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function showPortalToast(message) {
  const toast = document.getElementById('portal-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3500);
}
