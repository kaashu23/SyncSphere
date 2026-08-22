import React, { useEffect } from 'react';
import { SignInButton, useUser } from '@clerk/clerk-react';
import { Link, Navigate } from 'react-router-dom';
import './ThemeLandingPage.css';

export default function ThemeLandingPage() {
  const { isSignedIn, isLoaded } = useUser();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/onboarding" replace />;
  }

  useEffect(() => {
    // Add is-in class to animated elements after a small delay to simulate animationend
    const appearElements = document.querySelectorAll('.appear, .hero-photo, .badge-star, h1 em');
    
    // Add animation trigger
    const timer1 = setTimeout(() => {
      appearElements.forEach(el => el.classList.add('is-in'));
    }, 1500); // safety fallback

    const handleAnimationEnd = (e) => {
      e.target.classList.add('is-in');
    };

    appearElements.forEach(el => {
      el.addEventListener('animationend', handleAnimationEnd, { once: true });
    });

    return () => {
      clearTimeout(timer1);
      appearElements.forEach(el => {
        el.removeEventListener('animationend', handleAnimationEnd);
      });
    };
  }, []);

  return (
    <div className="theme-landing-root" style={{ background: '#000', color: '#fff', minHeight: '100vh', width: '100vw' }}>
      <div className="grain"></div>

      <div className="hero-photo">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4"
        ></video>
      </div>

      <div className="page">


        <header className="header">
          <Link to="/" className="logo appear appear--scale" style={{ '--d': '0.08s' }} aria-label="SyncSphere">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <g transform="rotate(-30 12 12)">
                <circle cx="7.3" cy="3.2" r="1.45" />
                <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <circle cx="16.7" cy="20.8" r="1.45" />
              </g>
            </svg>
            <span>SyncSphere</span>
          </Link>

          <SignInButton mode="modal">
            <button className="btn btn-solid header-cta appear appear--scale" style={{ '--d': '0.34s' }}>Get Started</button>
          </SignInButton>
        </header>

        <main className="hero" id="top">
          <div className="hero-copy">
            <div className="badge appear appear--pop" style={{ '--d': '0.22s' }}>
              <svg className="badge-star" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
              </svg>
              Next-Gen Collaboration
            </div>

            <h1>
              <span className="headline-line appear appear--mask" style={{ '--d': '0.42s' }}>
                <span>Sync your <em>team's</em> ideas</span>
              </span>
              <span className="headline-line appear appear--mask" style={{ '--d': '0.62s' }}>
                <span>in real-time.</span>
              </span>
            </h1>

            <p className="lede appear appear--soft" style={{ '--d': '0.82s' }}>
              A powerful, unified communication platform designed to keep your teams connected, productive, and secure.
            </p>

            <div className="hero-actions">
              <SignInButton mode="modal">
                <button className="btn btn-solid hero-btn appear appear--btn" style={{ '--d': '0.96s' }}>Start Chatting</button>
              </SignInButton>
              <a href="#demo" className="btn btn-ghost hero-btn appear appear--side" style={{ '--d': '1.10s' }}>See it in action</a>
            </div>
          </div>
        </main>

        <footer className="stats">
          <div className="stat appear appear--stat" style={{ '--d': '1.12s' }}>
            <svg viewBox="0 0 24 24">
              <linearGradient id="g1" x1="3" y1="2" x2="14" y2="22">
                <stop offset="0.38" stopColor="#ffffff" />
                <stop offset="0.62" stopColor="#3a3a3a" />
              </linearGradient>
              <linearGradient id="g2" x1="3" y1="2" x2="14" y2="22">
                <stop offset="0.38" stopColor="#3a3a3a" />
                <stop offset="0.62" stopColor="#ffffff" />
              </linearGradient>
              <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#g1)" />
              <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#g2)" />
              <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
            </svg>
            1M+ messages sent
          </div>

          <div className="stat appear appear--stat" style={{ '--d': '1.28s' }}>
            <svg viewBox="0 0 24 24">
              <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#ffffff" />
              <path d="M12 7.1v7.4 M8.15 12.35L12 16.2l3.85-3.85" stroke="#111" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            99.9% uptime
          </div>

          <div className="stat appear appear--stat" style={{ '--d': '1.44s' }}>
            <svg className="stat-icon-wide" viewBox="0 0 40 22">
              <circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" />
              <path d="M5.5 12L7.5 9L6.5 14Z" fill="#f4f4f4" />
              <path d="M14.9 12L12.9 9L13.9 14Z" fill="#f4f4f4" />
              <ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" />
              <circle cx="8.8" cy="11.5" r="0.7" fill="#1a1a1a" />
              <circle cx="11.6" cy="11.5" r="0.7" fill="#1a1a1a" />

              <circle cx="20.2" cy="11" r="9.2" fill="#ffffff" />
              <circle cx="17.8" cy="10" r="1.7" fill="#111" />
              <circle cx="22.6" cy="10" r="1.7" fill="#111" />
              <ellipse cx="20.2" cy="12" rx="1" ry="0.6" fill="#111" />
              <path d="M17.5 14 Q20.2 17 22.9 14" fill="none" stroke="#111" strokeWidth="1.2" strokeLinecap="round" />

              <circle cx="30.2" cy="11" r="9.2" fill="#f26b1d" />
              <text x="30.2" y="15.1" fill="white" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="12.5" textAnchor="middle">s</text>
            </svg>
            500+ teams onboarded
          </div>
        </footer>
      </div>
    </div>
  );
}
