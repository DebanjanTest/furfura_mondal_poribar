import { useEffect } from 'react';

export function useSectionScrollLocking() {
  useEffect(() => {
    const snapSections = [
      { id: 'hero-section', name: 'Hero' },
      { id: 'invitation-section', name: 'Invitation' },
      { id: 'photo-river-section', name: 'Photo River' },
      { id: 'onnota-section', name: 'Onnota' },
      { id: 'gallery-section', name: 'Gallery' }
    ];

    let isGliding = false;
    let isProgrammaticScrolling = false;
    let activeScrollAnimId = null;
    let glideCooldown = null;

    // Ponytail Custom Subtle Ease-In-Out Curve (cubic-bezier)
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    function smoothScrollToTarget(targetY, duration = 580, onComplete = null) {
      if (activeScrollAnimId) {
        cancelAnimationFrame(activeScrollAnimId);
        activeScrollAnimId = null;
      }

      const startY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const clampedTargetY = Math.max(0, Math.min(Math.round(targetY), maxScroll));
      const distance = clampedTargetY - startY;

      if (Math.abs(distance) < 2) {
        window.scrollTo(0, clampedTargetY);
        if (onComplete) onComplete();
        return;
      }

      isProgrammaticScrolling = true;
      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        window.scrollTo(0, Math.round(startY + distance * easedProgress));

        if (progress < 1) {
          activeScrollAnimId = requestAnimationFrame(step);
        } else {
          isProgrammaticScrolling = false;
          activeScrollAnimId = null;
          if (onComplete) onComplete();
        }
      }

      activeScrollAnimId = requestAnimationFrame(step);
    }

    function lockToSection(sectionIdOrEl) {
      const el = typeof sectionIdOrEl === 'string' ? document.getElementById(sectionIdOrEl) : sectionIdOrEl;
      if (!el) return;
      isGliding = true;

      const rect = el.getBoundingClientRect();
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
      const targetY = rect.top + currentScroll;

      smoothScrollToTarget(targetY, 580, () => {
        clearTimeout(glideCooldown);
        glideCooldown = setTimeout(() => {
          isGliding = false;
        }, 100);
      });

      clearTimeout(glideCooldown);
      glideCooldown = setTimeout(() => {
        isGliding = false;
      }, 700);
    }

    // Intercept in-page anchors (e.g. #invitation-section, #photo-river-section)
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;
      const targetId = href.substring(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        lockToSection(targetEl);
      }
    };

    document.addEventListener('click', handleAnchorClick);

    // Desktop Wheel Event Listener for Single-Scroll Section Locking
    const handleWheel = (e) => {
      if (window.innerWidth <= 768) return;

      // Do not intercept wheel if any modal/dialog is open or if event originates inside a modal
      if (
        document.body.classList.contains('modal-open') ||
        document.querySelector('.modal-backdrop.active, [role="dialog"].active') ||
        (e.target && typeof e.target.closest === 'function' && e.target.closest('.modal-backdrop, .modal-card, .modal-body-scroll, .track-list-scroll, [role="dialog"], .slideover-card'))
      ) {
        return;
      }

      // If currently gliding or animating, block further wheel to prevent jitter
      if (isProgrammaticScrolling || isGliding) {
        e.preventDefault();
        return;
      }

      const deltaThreshold = 15;
      if (Math.abs(e.deltaY) < deltaThreshold) return;

      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const vh = window.innerHeight;

      const heroEl = document.getElementById('hero-section');
      const inviteEl = document.getElementById('invitation-section');
      const riverEl = document.getElementById('photo-river-section');
      const onnotaEl = document.getElementById('onnota-section');
      const galleryEl = document.getElementById('gallery-section');

      if (!heroEl || !inviteEl || !riverEl || !onnotaEl || !galleryEl) return;

      const inviteTop = inviteEl.offsetTop;
      const inviteHeight = inviteEl.offsetHeight;
      const riverTop = riverEl.offsetTop;
      const onnotaTop = onnotaEl.offsetTop;
      const onnotaHeight = onnotaEl.offsetHeight;
      const galleryTop = galleryEl.offsetTop;

      // SECTION 0: HERO (Single scroll down locks to Invitation)
      if (scrollY < inviteTop - 30) {
        if (e.deltaY > 0) {
          e.preventDefault();
          lockToSection(inviteEl);
          return;
        }
      }

      // SECTION 1: INVITATION
      else if (scrollY >= inviteTop - 30 && scrollY < riverTop - 30) {
        const atTop = scrollY <= inviteTop + 15;
        const atBottom = scrollY + vh >= inviteTop + inviteHeight - 25;

        if (e.deltaY < 0 && atTop) {
          e.preventDefault();
          lockToSection(heroEl);
          return;
        }
        if (e.deltaY > 0 && atBottom) {
          e.preventDefault();
          lockToSection(riverEl);
          return;
        }
      }

      // SECTION 2: PHOTO RIVER (Single scroll takes to Onnota / Invitation)
      else if (scrollY >= riverTop - 30 && scrollY < onnotaTop - 30) {
        if (e.deltaY > 0) {
          e.preventDefault();
          lockToSection(onnotaEl);
          return;
        }
        if (e.deltaY < 0) {
          e.preventDefault();
          lockToSection(inviteEl);
          return;
        }
      }

      // SECTION 3: ONNOTA (Scroll within cards or lock to Gallery / River)
      else if (scrollY >= onnotaTop - 30 && scrollY < galleryTop - 30) {
        const onnotaGrid = document.getElementById('onnota-cards-grid') || document.querySelector('.onnota-cards-grid');
        
        // If cursor is over or interacting with the onnota cards grid
        if (onnotaGrid && e.target && typeof e.target.closest === 'function' && e.target.closest('#onnota-cards-grid, .onnota-cards-grid, .onnota-card')) {
          const canScrollDown = onnotaGrid.scrollTop + onnotaGrid.clientHeight < onnotaGrid.scrollHeight - 10;
          const canScrollUp = onnotaGrid.scrollTop > 10;

          // If the grid can scroll in the intended direction, allow normal grid scrolling and DO NOT lock
          if (e.deltaY > 0 && canScrollDown) {
            return;
          }
          if (e.deltaY < 0 && canScrollUp) {
            return;
          }
        }

        const atTop = scrollY <= onnotaTop + 15;
        const atBottom = scrollY + vh >= onnotaTop + onnotaHeight - 30;

        if (e.deltaY < 0 && atTop) {
          e.preventDefault();
          lockToSection(riverEl);
          return;
        }
        if (e.deltaY > 0 && atBottom) {
          e.preventDefault();
          lockToSection(galleryEl);
          return;
        }
      }

      // SECTION 4: GRAND GALLERY (Continuous scrolling, scroll up past top locks to Onnota)
      else if (scrollY >= galleryTop - 30) {
        const atTop = scrollY <= galleryTop + 15;
        if (e.deltaY < 0 && atTop) {
          e.preventDefault();
          lockToSection(onnotaEl);
          return;
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    // PageUp / PageDown Keyboard Navigation
    const handleKeyDown = (e) => {
      if (['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase())) return;

      if (
        document.body.classList.contains('modal-open') ||
        document.querySelector('.modal-backdrop.active, [role="dialog"].active') ||
        (e.target && typeof e.target.closest === 'function' && e.target.closest('.modal-backdrop, .modal-card, [role="dialog"]'))
      ) {
        return;
      }

      if (e.key === 'PageDown' || e.key === 'PageUp') {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        const vh = window.innerHeight;
        const probeY = scrollY + vh * 0.4;
        let currentIdx = 0;

        for (let i = snapSections.length - 1; i >= 0; i--) {
          const secEl = document.getElementById(snapSections[i].id);
          if (secEl && probeY >= secEl.offsetTop) {
            currentIdx = i;
            break;
          }
        }

        const direction = e.key === 'PageDown' ? 1 : -1;
        const nextIdx = Math.max(0, Math.min(snapSections.length - 1, currentIdx + direction));
        const targetSec = document.getElementById(snapSections[nextIdx].id);
        if (targetSec) {
          e.preventDefault();
          lockToSection(targetSec);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      if (activeScrollAnimId) cancelAnimationFrame(activeScrollAnimId);
      clearTimeout(glideCooldown);
    };
  }, []);
}
