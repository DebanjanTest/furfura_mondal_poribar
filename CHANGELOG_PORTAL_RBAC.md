# Mondol Barir Pujo (ফুরফুরা মণ্ডল পরিবার)
## Access-Based Control System & Curator Portal Architecture Guide

---

### 1. Architectural Overview & 3-Tier Roles

This document outlines the Role-Based Access Control (RBAC) system for the **Mondol Barir Pujo** platform. The system operates on three distinct user roles determined automatically via Google Authentication.

```
                    [ User Signs In with Google ]
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
  👑 1. Admin              ✍️ 2. Editor             👥 3. Visitor
 (Super Admin:            (Family Organizers       (Public Devotees &
  debanjanmondal8996       assigned in Firebase)    General Visitors)
  @gmail.com)
         │                        │                        │
         ▼                        ▼                        ▼
 Full Master Access       Content Management       Public Website Only
 • Upload / Edit / Delete • Upload / Edit / Delete • View, Listen, Like
 • Photo River & Gallery  • Photo River & Gallery  • Story Card Generator
 • Onnota Creations       • Onnota Creations       • Auspicious RSVP
 • Live Announcements     • (No Global Config)     • (Sign-In 100% Optional)
 • Full Portal Access     • Full Portal Access     • (Portal Access Blocked)
```

---

### 2. Role Specifications & Permissions Matrix

| Capability | 👑 Admin (`debanjanmondal8996@gmail.com`) | ✍️ Editor (Assigned in Firebase) | 👥 Visitor (Public Devotees) |
| :--- | :---: | :---: | :---: |
| **Public Website Access** | Full Access | Full Access | Full Access *(Sign-In Optional)* |
| **Listen to Puja Radio & Dhak Studio** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Generate & Download Story Cards** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Send RSVP & Greetings** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Curator Portal Access (`portal.html`)** | ✅ Yes | ✅ Yes | ❌ *(Blocked with Access Denied)* |
| **Upload Photos to Photo River & Gallery** | ✅ Yes | ✅ Yes | ❌ No |
| **Edit Existing Photo Details & Captions** | ✅ Yes | ✅ Yes | ❌ No |
| **Delete Existing Photos & River Cards** | ✅ Yes | ✅ Yes | ❌ No |
| **Post / Edit / Delete Onnota Artworks** | ✅ Yes | ✅ Yes | ❌ No |
| **Manage Live Announcements & Timeline** | ✅ Yes | ❌ *(Admin Only)* | ❌ No |
| **In-Website Role Tampering Allowed** | ❌ No | ❌ No | ❌ No |

---

### 3. How Roles Are Controlled Externally (In Firebase Console)

As required, **no role assignment buttons exist on the website**. You as the Super Admin have full external authority to add, update, or revoke Editor roles directly in your Firebase Firestore database:

#### How to Add a New Editor:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select the **`mondal-barir-pujo`** project.
3. Navigate to **Build** $\rightarrow$ **Firestore Database**.
4. In the **`user_roles`** collection, click **Add Document**:
   - **Document ID**: The person's exact Google email in lowercase (e.g., `family_member@gmail.com`).
   - **Field 1**: `role` (Type: `string`, Value: `"editor"`).
   - **Field 2**: `name` (Type: `string`, Value: `"Name of Person"`).
   - **Field 3**: `createdAt` (Type: `timestamp` or `string`).
5. Click **Save**.
6. When that family member navigates to `https://furfura-mondal-poribar.vercel.app/portal.html` and signs in with their Google account, they will automatically be granted **Editor** permissions!

#### How to Revoke an Editor:
- Simply delete their document or change `"role"` to `"visitor"` in Firestore.

---

### 4. Portal vs. Public Website URLs

1. **Public Devotee Website**:
   - **Local**: `http://localhost:3000/`
   - **Production**: `https://furfura-mondal-poribar.vercel.app/`
   - **Experience**: 100% clean, immersive festive website with zero upload boxes or admin controls. Sign-in is optional.

2. **Dedicated Curator Management Portal**:
   - **Local**: `http://localhost:3000/portal.html`
   - **Production**: `https://furfura-mondal-poribar.vercel.app/portal.html`
   - **Experience**: Standalone Ponytail glassmorphic management dashboard with Google Auth barrier.

---

### 5. Traceback & Rollback Reference

- **Previous Setup**: Public community photo upload widget resided inside the gallery section (`#main-photo-gallery-grid`). Public visitors could submit photos into localStorage directly from `index.html`.
- **New RBAC Setup**:
  1. `portal.html`: Standalone Curator Portal for Admins & Editors.
  2. `src/portal.js` & `src/styles/portal.css`: Dedicated portal controller and glassmorphic UI.
  3. `src/services/rbacService.js`: Dynamic role resolution against Super Admin definition and Firestore `user_roles`.
  4. `src/services/contentStore.js`: Unified data layer for managing curated River & Gallery photos and Onnota artworks across portal and public website.
  5. `index.html`: Cleaned up public view showing only approved curated photos with optional Google devotee personalization.
