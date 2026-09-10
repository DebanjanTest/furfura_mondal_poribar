import React from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function GoogleSigninModal() {
  const { activeModal, closeModal } = useUI();
  const { signInWithGoogle, user, signOut } = useAuth();
  const { lang } = useLanguage();

  if (activeModal !== 'googleSignin') return null;

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      closeModal();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-backdrop active" id="google-signin-modal" role="dialog" aria-modal="true" aria-label="Google Authentication">
      <div className="modal-card auth-modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-subtitle">AUTHENTICATION</span>
            <h2 className="modal-title">{lang === 'bn' ? 'Google সাইন ইন' : 'Google Sign In'}</h2>
          </div>
          <button type="button" className="close-btn" onClick={closeModal}>✕</button>
        </div>

        <div className="modal-body auth-modal-body" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          {!user ? (
            <>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                {lang === 'bn' 
                  ? 'মন্ডল বাড়ির পুজো প্ল্যাটফর্মে আপনার অ্যাকাউন্ট যুক্ত করে ছবি আপলোড এবং পছন্দের গান সংরক্ষণ করুন।' 
                  : 'Sign in with Google to upload photos and save your festive preferences.'}
              </p>
              <button 
                type="button" 
                className="welcome-google-btn" 
                onClick={handleSignIn}
                style={{ width: '100%', justifyContent: 'center', margin: '0 auto' }}
              >
                <svg className="google-svg" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google দিয়ে সাইন ইন করুন</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <img src={user.photoURL} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #ffcf40' }} />
              <div>
                <h3 style={{ margin: 0, color: '#ffcf40' }}>{user.displayName}</h3>
                <p style={{ margin: '0.25rem 0 0', color: 'rgba(255, 255, 255, 0.7)' }}>{user.email}</p>
              </div>
              <button 
                type="button" 
                className="btn-upload-clear" 
                onClick={() => { signOut(); closeModal(); }}
                style={{ marginTop: '1rem' }}
              >
                সাইন আউট
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
